from datetime import datetime, timezone
from fastapi import APIRouter
from app.models.responses import HealthResponse
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Health check endpoint.
    Returns the current status of the AI service.
    """
    return HealthResponse(
        success=True,
        status="ok",
        service="krishi-ai-service",
        version=settings.app_version,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
