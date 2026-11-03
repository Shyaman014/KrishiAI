"""POST /api/v1/predict — Crop disease inference endpoint."""

import logging
from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException, status

from app.models.responses import PredictionResponse, ErrorResponse
from app.services.predictor import CropDiseasePredictor

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _get_predictor(request: Request) -> CropDiseasePredictor:
    """Retrieve the shared predictor instance stored in app.state."""
    predictor: CropDiseasePredictor | None = getattr(request.app.state, "predictor", None)
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI model is not ready. Please retry in a few seconds.",
        )
    return predictor


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid or corrupted image"},
        413: {"model": ErrorResponse, "description": "Image exceeds 10 MB limit"},
        422: {"model": ErrorResponse, "description": "Image preprocessing failed"},
        503: {"model": ErrorResponse, "description": "Model not ready"},
    },
    tags=["Inference"],
    summary="Crop Disease Detection",
    description=(
        "Accepts a crop leaf image (JPEG, PNG, or WebP) and returns an AI diagnostic result "
        "using the EfficientNet-B0 PlantVillage classifier. Predictions with confidence below "
        "0.50 or high entropy are flagged as inconclusive."
    ),
)
async def predict_disease(
    request: Request,
    image: UploadFile = File(..., description="Crop leaf photograph (JPEG/PNG/WebP, max 10 MB)"),
    scan_id: str | None = Form(None, description="Optional MongoDB scan document ID to link result"),
) -> PredictionResponse:
    """Run inference on an uploaded crop leaf image."""

    # 1. Validate content type
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{image.content_type}'. Accepted: JPEG, PNG, WebP.",
        )

    # 2. Read and validate size
    image_bytes = await image.read()
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image size {len(image_bytes) // (1024 * 1024):.1f} MB exceeds the 10 MB limit.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Received empty file. Please upload a valid image.",
        )

    # 3. Run inference
    predictor = _get_predictor(request)
    try:
        result = predictor.predict(image_bytes)
    except ValueError as exc:
        logger.warning("Image preprocessing failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.error("Unexpected inference error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during inference. Please try again.",
        ) from exc

    logger.info(
        "Prediction complete | scan_id=%s | crop=%s | disease=%s | confidence=%.1f%% | status=%s",
        scan_id or "N/A",
        result["crop"],
        result["disease"],
        result["confidence"],
        result["status"],
    )

    return PredictionResponse(
        success=True,
        scan_id=scan_id,
        crop=result["crop"],
        disease=result["disease"],
        is_healthy=result["is_healthy"],
        severity=result["severity"],
        confidence=result["confidence"],
        status=result["status"],
        is_confident=result["is_confident"],
        top_predictions=result["top_predictions"],
        model_version=result["model_version"],
        processing_time_ms=result["processing_time_ms"],
        message=result["message"],
    )
