"""GET /api/v1/model/info — Model metadata endpoint."""

import logging
from fastapi import APIRouter, Request, HTTPException, status

from app.models.responses import ModelInfoResponse
from app.services.classes import CLASS_NAMES
from app.services.predictor import CropDiseasePredictor, MODEL_VERSION, CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/model/info",
    response_model=ModelInfoResponse,
    tags=["Model"],
    summary="Model Information",
    description="Returns metadata about the loaded AI model including architecture, supported classes and thresholds.",
)
async def model_info(request: Request) -> ModelInfoResponse:
    """Return information about the currently loaded AI model."""
    predictor: CropDiseasePredictor | None = getattr(request.app.state, "predictor", None)
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not yet initialized.",
        )

    return ModelInfoResponse(
        architecture="EfficientNet-B0",
        model_version=MODEL_VERSION,
        num_classes=len(CLASS_NAMES),
        classes=CLASS_NAMES,
        confidence_threshold=predictor.confidence_threshold,
        device=str(predictor.device),
    )
