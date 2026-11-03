"""Pydantic response schemas for all AI service endpoints."""

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    success: bool = True
    status: str
    service: str
    version: str
    timestamp: str


class PredictionCandidate(BaseModel):
    class_id: int
    raw_class: str
    crop: str
    disease: str
    is_healthy: bool
    severity: str
    confidence: float


class PredictionResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    success: bool = True
    scan_id: str | None = None
    crop: str
    disease: str
    is_healthy: bool
    severity: str
    confidence: float
    status: str = Field(..., description="'completed' or 'inconclusive'")
    is_confident: bool
    top_predictions: list[PredictionCandidate]
    model_version: str
    processing_time_ms: float
    message: str


class ModelInfoResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    architecture: str
    model_version: str
    num_classes: int
    classes: list[str]
    confidence_threshold: float
    device: str


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: str | None = None
