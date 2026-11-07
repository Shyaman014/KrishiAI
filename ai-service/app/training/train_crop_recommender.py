"""
Training script for the KrishiAI Crop Recommendation model.

Trains a RandomForestClassifier on a synthetic crop dataset derived from
published agronomic ranges (ICAR / FAO).

Usage:
    python -m app.training.train_crop_recommender

Outputs:
    checkpoints/crop_recommender/model.pkl          – trained RandomForest model
    checkpoints/crop_recommender/label_encoder.pkl  – LabelEncoder for class names
    checkpoints/crop_recommender/feature_names.pkl  – ordered feature name list
    checkpoints/crop_recommender/model_metadata.json – training metadata

NOTE: Predictions from this model should always be verified with local
agricultural experts before making farming decisions.
"""

import json
import logging
import os
import sys
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder

# ---------------------------------------------------------------------------
# Ensure the project root is on sys.path when run as __main__
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.training.crop_data import FEATURE_NAMES, generate_dataset  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

CHECKPOINT_DIR = PROJECT_ROOT / "ai-service" / "checkpoints" / "crop_recommender"
MODEL_VERSION = "1.0.0"


def train() -> None:
    logger.info("=" * 60)
    logger.info("KrishiAI Crop Recommendation Model Training")
    logger.info("=" * 60)
    logger.info(
        "DISCLAIMER: Training on synthetic data derived from published "
        "agronomic ranges. Not a substitute for real soil testing."
    )

    # ---- Generate dataset ----
    logger.info("Generating synthetic crop dataset …")
    X_raw, y_raw = generate_dataset()
    X = np.array(X_raw, dtype=np.float32)
    y = np.array(y_raw)

    logger.info("Dataset: %d samples, %d features, %d classes", len(X), X.shape[1], len(np.unique(y)))

    # ---- Encode labels ----
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    classes = list(le.classes_)
    logger.info("Classes: %s", classes)

    # ---- Train / test split (stratified 80/20) ----
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.20, random_state=42, stratify=y_enc
    )
    logger.info(
        "Split: %d train / %d test samples (stratified 80/20)",
        len(X_train),
        len(X_test),
    )

    # ---- Train RandomForest ----
    logger.info("Training RandomForestClassifier(n_estimators=200, random_state=42) …")
    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # ---- Evaluate on test set ----
    y_pred = clf.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    logger.info("Test accuracy: %.4f (%.2f%%)", test_accuracy, test_accuracy * 100)

    report = classification_report(
        y_test, y_pred, target_names=classes, zero_division=0
    )
    logger.info("Classification report:\n%s", report)

    # ---- Cross-validation (5-fold) ----
    logger.info("Running 5-fold stratified cross-validation …")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X, y_enc, cv=cv, scoring="accuracy", n_jobs=-1)
    logger.info(
        "CV accuracy: %.4f ± %.4f (min=%.4f, max=%.4f)",
        cv_scores.mean(),
        cv_scores.std(),
        cv_scores.min(),
        cv_scores.max(),
    )

    # ---- Feature importance ----
    importances = clf.feature_importances_
    logger.info("Feature importances:")
    for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1]):
        logger.info("  %-15s %.4f", name, imp)

    # ---- Save checkpoints ----
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

    model_path = CHECKPOINT_DIR / "model.pkl"
    le_path = CHECKPOINT_DIR / "label_encoder.pkl"
    features_path = CHECKPOINT_DIR / "feature_names.pkl"
    metadata_path = CHECKPOINT_DIR / "model_metadata.json"

    joblib.dump(clf, model_path)
    joblib.dump(le, le_path)
    joblib.dump(FEATURE_NAMES, features_path)

    metadata = {
        "model_version": MODEL_VERSION,
        "model_type": "RandomForestClassifier",
        "n_estimators": 200,
        "n_features": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "n_classes": len(classes),
        "classes": classes,
        "dataset_note": (
            "Synthetic dataset derived from published agronomic parameter ranges "
            "(ICAR / FAO). Not sourced from real soil measurements."
        ),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "test_accuracy": float(round(test_accuracy, 6)),
        "cv_accuracy_mean": float(round(cv_scores.mean(), 6)),
        "cv_accuracy_std": float(round(cv_scores.std(), 6)),
        "disclaimer": (
            "Model predictions are based on training data patterns and synthetic "
            "agronomic ranges. Always verify recommendations with a local agricultural expert."
        ),
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    logger.info("=" * 60)
    logger.info("Checkpoints saved to: %s", CHECKPOINT_DIR)
    logger.info("  model.pkl          : %s", model_path)
    logger.info("  label_encoder.pkl  : %s", le_path)
    logger.info("  feature_names.pkl  : %s", features_path)
    logger.info("  model_metadata.json: %s", metadata_path)
    logger.info("Training complete. ✅")
    logger.info("=" * 60)


if __name__ == "__main__":
    train()

