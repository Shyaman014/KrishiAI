"""Pydantic schemas for Disease Explanation and Gemini AI generation."""

from pydantic import BaseModel, ConfigDict, Field
from app.models.responses import PredictionCandidate


class TreatmentGuidanceSchema(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    general_approaches: list[str] = Field(default_factory=list)
    chemical_guidance: list[str] = Field(default_factory=list)
    organic_treatments: list[str] = Field(default_factory=list)
    when_to_seek_help: str = ""


class ExplanationData(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    scientific_name: str = ""
    overview: str = ""
    symptoms: list[str] = Field(default_factory=list)
    causes: list[str] = Field(default_factory=list)
    environmental_conditions: list[str] = Field(default_factory=list)
    impact_on_growth: str = ""
    early_warning_signs: list[str] = Field(default_factory=list)
    severity_explanation: str = ""
    prevention: list[str] = Field(default_factory=list)
    sanitation: list[str] = Field(default_factory=list)
    treatment: TreatmentGuidanceSchema = Field(default_factory=TreatmentGuidanceSchema)
    reference_sources: list[str] = Field(default_factory=list)
    disclaimer: str = (
        "Notice: This automated report is for informational agricultural screening only. "
        "Consult your local agricultural extension service or certified agronomist before applying chemical treatments."
    )
    language: str = "en"
    model_identifier: str = "krishi-knowledge-base-v1"
    generated_at: str = ""


class ExplanationRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    crop: str
    disease: str
    confidence: float
    is_healthy: bool = False
    status: str = "completed"
    top_predictions: list[PredictionCandidate] = Field(default_factory=list)
    language: str = "en"
    scan_id: str | None = None


class ExplanationResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    success: bool = True
    scan_id: str | None = None
    crop: str
    disease: str
    is_healthy: bool
    confidence: float
    status: str
    explanation: ExplanationData

