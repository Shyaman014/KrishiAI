from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import time
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings
from app.routers import health as health_router

# Import to trigger logging setup
from app.core import logging as _logging_setup  # noqa: F401

logger = logging.getLogger(__name__)
settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="KrishiAI – AI/ML inference and agricultural intelligence service",
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
    )

    # ---- CORS ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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

    # ---- Root ----
    @app.get("/", tags=["Root"])
    async def root() -> dict[str, str]:
        return {
            "message": "KrishiAI AI Service is running 🌱",
            "docs": "/docs",
            "health": "/health",
        }

    return app


app = create_app()
