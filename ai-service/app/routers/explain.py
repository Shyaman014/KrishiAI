"""POST /api/v1/explain — Intelligent Disease Analysis & Agronomic Advisory endpoint."""

import logging
from fastapi import APIRouter, HTTPException, status

from app.models.explanation import ExplanationRequest, ExplanationResponse
from app.models.responses import ErrorResponse
from app.services.explainer import DiseaseExplainerService

logger = logging.getLogger(__name__)

router = APIRouter()
_explainer_service = DiseaseExplainerService()


@router.post(
    "/explain",
    response_model=ExplanationResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid explanation request"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Internal explanation service error"},
    },
    tags=["Explanation"],
    summary="Generate Disease Explanation & Agronomic Advisory",
    description=(
        "Synthesizes grounded agronomic explanation, symptoms, causes, environmental triggers, "
        "prevention measures, and safe treatment guidance for a classified plant leaf scan using "
        "Google Gemini API and verified institutional agricultural knowledge."
    ),
)
async def explain_disease(request: ExplanationRequest) -> ExplanationResponse:
    """Generate agricultural disease explanation and advisory report."""
    if not request.crop or not request.disease:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Crop name and disease name are required to generate an explanation.",
        )

    try:
        explanation_data = _explainer_service.explain(request)
    except Exception as exc:
        logger.error("Failed to generate disease explanation: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate disease explanation. Please try again.",
        ) from exc

    logger.info(
        "Explanation generated | scan_id=%s | crop=%s | disease=%s | language=%s | model=%s",
        request.scan_id or "N/A",
        request.crop,
        request.disease,
        explanation_data.language,
        explanation_data.model_identifier,
    )

    return ExplanationResponse(
        success=True,
        scan_id=request.scan_id,
        crop=request.crop,
        disease=request.disease,
        is_healthy=request.is_healthy,
        confidence=request.confidence,
        status=request.status,
        explanation=explanation_data,
    )

