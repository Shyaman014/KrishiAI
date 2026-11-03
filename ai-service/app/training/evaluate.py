"""Model Evaluation and Benchmark Diagnostics on Independent Test Split."""

import torch
import numpy as np
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support
import logging

from app.services.classes import NUM_CLASSES, CLASS_NAMES
from app.services.model import create_model
from app.training.train import SyntheticPlantDataset

logger = logging.getLogger(__name__)


def evaluate_model(weights_path: str | None = None) -> dict[str, float]:
    """Evaluates the classifier on an independent test split and outputs metrics."""
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = create_model(num_classes=NUM_CLASSES, weights_path=weights_path, device=device)
    model.eval()

    test_dataset = SyntheticPlantDataset(num_samples=76)
    test_loader = torch.utils.data.DataLoader(test_dataset, batch_size=16, shuffle=False)

    all_preds: list[int] = []
    all_targets: list[int] = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.numpy().tolist())

    accuracy = accuracy_score(all_targets, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        all_targets, all_preds, average="weighted", zero_division=0
    )

    logger.info("=== Model Test Evaluation Summary ===")
    logger.info("Overall Test Accuracy: %.2f%%", accuracy * 100)
    logger.info("Weighted Precision:    %.4f", precision)
    logger.info("Weighted Recall:       %.4f", recall)
    logger.info("Weighted F1-Score:     %.4f", f1)

    return {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
    }


if __name__ == "__main__":
    evaluate_model()

