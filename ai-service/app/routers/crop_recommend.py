"""
FastAPI Router – Crop Recommendation  (POST /api/v1/recommend-crop)

Phase 10: KrishiAI Intelligent Crop Recommendation System.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator

from app.services.crop_recommender import (
    DISCLAIMER,
    CropRecommenderNotReadyError,
    get_crop_recommender,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Crop Recommendation"])

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class CropRecommendationRequest(BaseModel):
    """Input parameters for crop recommendation."""

    N: float = Field(..., ge=0, le=300, description="Nitrogen content (kg/ha)")
    P: float = Field(..., ge=0, le=300, description="Phosphorus content (kg/ha)")
    K: float = Field(..., ge=0, le=300, description="Potassium content (kg/ha)")
    temperature: float = Field(..., ge=-10, le=55, description="Mean temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity (%)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    rainfall: float = Field(..., ge=0, le=600, description="Annual/seasonal rainfall (mm)")
    language: Literal["en", "hi", "as"] = Field(
        default="en",
        description="Response language: en=English, hi=Hindi, as=Assamese",
    )

    @field_validator("ph")
    @classmethod
    def ph_range(cls, v: float) -> float:
        if not (0 <= v <= 14):
            raise ValueError("Soil pH must be between 0 and 14")
        return v


class SupportingFactor(BaseModel):
    factor: str
    value: str
    importance_pct: str
    explanation: str


class CropRecommendationItem(BaseModel):
    rank: int
    crop: str
    confidence: float
    confidence_pct: float
    supporting_factors: list[SupportingFactor]
    growing_duration: str
    water_requirement: str
    suitable_season: str
    soil_requirement: str
    description: str
    source: str
    disclaimer: str


class CropRecommendationResponse(BaseModel):
    success: bool = True
    model_version: str
    recommendations: list[CropRecommendationItem]
    input_summary: dict[str, Any]
    disclaimer: str
    data_source_note: str


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/recommend-crop",
    response_model=CropRecommendationResponse,
    summary="Get top-3 crop recommendations",
    description=(
        "Accepts soil nutrient and climate parameters and returns the top-3 "
        "most suitable crops predicted by a trained Random Forest model. "
        "Predictions are based on synthetic agronomic data and must be verified "
        "with local agricultural experts before making farming decisions."
    ),
)
async def recommend_crop(
    request: Request,
    body: CropRecommendationRequest,
) -> CropRecommendationResponse:
    """Return top-3 crop recommendations for the given agronomic inputs."""
    logger.info(
        "Crop recommendation request: N=%.1f P=%.1f K=%.1f temp=%.1f hum=%.1f ph=%.2f rain=%.1f lang=%s",
        body.N, body.P, body.K, body.temperature, body.humidity, body.ph, body.rainfall, body.language,
    )

    try:
        recommender = get_crop_recommender()
    except CropRecommenderNotReadyError as exc:
        logger.error("Crop recommender not ready: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Crop recommendation model is not available. "
                "Please contact support or run the training script."
            ),
        ) from exc
    except Exception as exc:
        logger.error("Failed to load crop recommender: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error initialising crop recommendation service.",
        ) from exc

    try:
        raw_results = recommender.predict_top3(
            N=body.N,
            P=body.P,
            K=body.K,
            temperature=body.temperature,
            humidity=body.humidity,
            ph=body.ph,
            rainfall=body.rainfall,
        )
    except CropRecommenderNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Prediction error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Crop recommendation prediction failed. Please try again.",
        ) from exc

    recommendations = [CropRecommendationItem(**item) for item in raw_results]

    return CropRecommendationResponse(
        model_version=recommender.model_version,
        recommendations=recommendations,
        input_summary={
            "N": body.N,
            "P": body.P,
            "K": body.K,
            "temperature": body.temperature,
            "humidity": body.humidity,
            "ph": body.ph,
            "rainfall": body.rainfall,
            "language": body.language,
        },
        disclaimer=DISCLAIMER,
        data_source_note=(
            "Model trained on synthetic agronomic data derived from published "
            "ICAR and FAO crop production guidelines. "
            "Confidence scores reflect training data patterns, not real-field measurements."
        ),
    )

