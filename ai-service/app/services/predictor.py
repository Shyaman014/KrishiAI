"""Crop Disease Prediction Engine with Uncertainty and Ambiguity Rejection Safeguards."""

import time
import math
import torch
import torch.nn.functional as F
from typing import TypedDict
import logging

from app.services.classes import CLASS_MAP, NUM_CLASSES, ClassMetadata
from app.services.model import create_model, PlantDiseaseClassifier
from app.services.preprocessing import decode_and_preprocess_image

logger = logging.getLogger(__name__)

# Calibrated decision threshold: predictions below 50% are deemed uncertain
CONFIDENCE_THRESHOLD = 0.50
# Maximum allowable normalized entropy (0.0 to 1.0)
MAX_ENTROPY_THRESHOLD = 0.82
MODEL_VERSION = "EfficientNet-B0-PlantVillage-v1.0"


class PredictionCandidate(TypedDict):
    class_id: int
    raw_class: str
    crop: str
    disease: str
    is_healthy: bool
    severity: str
    confidence: float


class PredictionOutput(TypedDict):
    crop: str
    disease: str
    is_healthy: bool
    severity: str
    confidence: float
    status: str  # 'completed' | 'inconclusive'
    is_confident: bool
    top_predictions: list[PredictionCandidate]
    model_version: str
    processing_time_ms: float
    message: str


class CropDiseasePredictor:
    """Production inference engine for plant leaf disease classification."""

    def __init__(
        self,
        weights_path: str | None = None,
        confidence_threshold: float = CONFIDENCE_THRESHOLD,
    ) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.confidence_threshold = confidence_threshold
        self.model: PlantDiseaseClassifier = create_model(
            num_classes=NUM_CLASSES,
            weights_path=weights_path,
            device=self.device,
        )
        logger.info(
            "Predictor initialized on %s (Threshold: %.2f, Version: %s)",
            self.device,
            self.confidence_threshold,
            MODEL_VERSION,
        )

    def predict(self, image_bytes: bytes) -> PredictionOutput:
        """Executes inference on uploaded image bytes with uncertainty safeguards.

        Args:
            image_bytes: Raw binary image payload.

        Returns:
            Structured PredictionOutput dictionary.
        """
        start_time = time.perf_counter()

        # 1. Decode & Preprocess
        tensor = decode_and_preprocess_image(image_bytes).to(self.device)

        # 2. Forward pass with PyTorch inference mode
        with torch.inference_mode():
            logits = self.model(tensor)
            probabilities = F.softmax(logits, dim=1).squeeze(0)

        # 3. Calculate Normalized Shannon Entropy: H(p) = -sum(p * log2(p)) / log2(K)
        # High entropy signals uniform distribution (unrelated image or ambiguous input)
        eps = 1e-9
        entropy = -torch.sum(probabilities * torch.log2(probabilities + eps)).item()
        max_possible_entropy = math.log2(NUM_CLASSES)
        normalized_entropy = entropy / max_possible_entropy

        # 4. Extract Top 3 Candidates
        top_k = min(3, NUM_CLASSES)
        top_probs, top_indices = torch.topk(probabilities, k=top_k)

        top_predictions: list[PredictionCandidate] = []
        for prob, idx in zip(top_probs, top_indices):
            class_id = idx.item()
            conf = round(prob.item() * 100, 2)
            meta: ClassMetadata = CLASS_MAP.get(
                class_id,
                {
                    "id": class_id,
                    "raw_class": f"Class_{class_id}",
                    "crop": "Unknown",
                    "disease": "Unknown",
                    "is_healthy": False,
                    "severity_category": "moderate",
                    "description": "",
                },
            )
            top_predictions.append(
                {
                    "class_id": class_id,
                    "raw_class": meta["raw_class"],
                    "crop": meta["crop"],
                    "disease": meta["disease"],
                    "is_healthy": meta["is_healthy"],
                    "severity": meta["severity_category"],
                    "confidence": conf,
                }
            )

        top_candidate = top_predictions[0]
        top_confidence_ratio = top_probs[0].item()

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # 5. Uncertainty & Rejection Safeguard
        # If confidence is lower than threshold OR prediction is overly ambiguous:
        if (
            top_confidence_ratio < self.confidence_threshold
            or normalized_entropy > MAX_ENTROPY_THRESHOLD
        ):
            logger.info(
                "Prediction rejected due to uncertainty (Confidence: %.2f%%, Entropy: %.2f)",
                top_candidate["confidence"],
                normalized_entropy,
            )
            return {
                "crop": top_candidate["crop"],
                "disease": "Inconclusive / Low Confidence",
                "is_healthy": False,
                "severity": "moderate",
                "confidence": top_candidate["confidence"],
                "status": "inconclusive",
                "is_confident": False,
                "top_predictions": top_predictions,
                "model_version": MODEL_VERSION,
                "processing_time_ms": duration_ms,
                "message": (
                    "Unable to confidently identify the crop disease. Please upload a clearer "
                    "leaf photograph in natural daylight or consult an agricultural extension specialist."
                ),
            }

        return {
            "crop": top_candidate["crop"],
            "disease": top_candidate["disease"],
            "is_healthy": top_candidate["is_healthy"],
            "severity": top_candidate["severity"],
            "confidence": top_candidate["confidence"],
            "status": "completed",
            "is_confident": True,
            "top_predictions": top_predictions,
            "model_version": MODEL_VERSION,
            "processing_time_ms": duration_ms,
            "message": "AI diagnostic screening completed successfully.",
        }

