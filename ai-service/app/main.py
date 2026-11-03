from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging
import time
import os

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.core.config import get_settings
from app.core import logging as _logging_setup  # noqa: F401
from app.routers import health as health_router
from app.routers import predict as predict_router
from app.routers import model_info as model_info_router
from app.routers import explain as explain_router
from app.services.predictor import CropDiseasePredictor

logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: load model on startup, release on shutdown."""
    logger.info("KrishiAI AI Service starting up...")
    weights_path = settings.model_weights_path

    if os.path.exists(weights_path):
        logger.info("Loading model weights from %s", weights_path)
        app.state.predictor = CropDiseasePredictor(
            weights_path=weights_path,
            confidence_threshold=settings.confidence_threshold,
        )
    else:
        logger.warning(
            "Model checkpoint not found at '%s'. Starting with untrained EfficientNet-B0 backbone. "
            "Run 'python -m app.training.train' to generate weights.",
            weights_path,
        )
        app.state.predictor = CropDiseasePredictor(
            weights_path=None,
            confidence_threshold=settings.confidence_threshold,
        )

    logger.info("AI model initialized and ready for inference.")
    yield
    # Shutdown: free GPU/CPU memory
    del app.state.predictor
    logger.info("KrishiAI AI Service shut down cleanly.")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="KrishiAI – AI/ML inference and agricultural intelligence service",
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
        lifespan=lifespan,
    )

    # ---- CORS ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Internal API Key Middleware ----
    @app.middleware("http")
    async def internal_key_auth(request: Request, call_next: object) -> Response:
        """Reject requests missing the internal service key when one is configured."""
        internal_key = settings.internal_api_key
        # Only enforce on /api/v1/* routes
        if internal_key and request.url.path.startswith("/api/v1/"):
            provided_key = request.headers.get("X-Internal-Key", "")
            if provided_key != internal_key:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Missing or invalid internal service key.",
                )
        response: Response = await call_next(request)  # type: ignore[operator]
        return response

    # ---- Request Logging Middleware ----
    @app.middleware("http")
    async def log_requests(request: Request, call_next: object) -> Response:
        start_time = time.perf_counter()
        response: Response = await call_next(request)  # type: ignore[operator]
        duration = (time.perf_counter() - start_time) * 1000
        logger.info(
            "%s %s %s %.2fms",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )
        return response

    # ---- Routers ----
    app.include_router(health_router.router)
    app.include_router(predict_router.router, prefix="/api/v1")
    app.include_router(model_info_router.router, prefix="/api/v1")
    app.include_router(explain_router.router, prefix="/api/v1")

    # ---- Root ----
    @app.get("/", tags=["Root"])
    async def root() -> dict[str, str]:
        return {
            "message": "KrishiAI AI Service is running 🌱",
            "docs": "/docs",
            "health": "/health",
            "predict": "/api/v1/predict",
            "model_info": "/api/v1/model/info",
            "explain": "/api/v1/explain",
        }

    return app


app = create_app()
