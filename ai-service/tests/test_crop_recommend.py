"""
Tests for the crop recommendation endpoint – Phase 10.

Covers:
  - Valid input → returns 3 crops with confidence scores
  - Out-of-range inputs → 422 validation errors
  - Missing required fields → 422
  - Confidence scores are non-negative and sum ≤ 1.0
  - Disclaimer is always present
  - Language parameter accepted (en, hi, as)
  - Model metadata fields present in response
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

HEADERS: dict[str, str] = {}  # internal key not configured in test env

VALID_PAYLOAD = {
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.0,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.9,
    "language": "en",
}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def post_recommend(payload: dict) -> dict:
    response = client.post("/api/v1/recommend-crop", json=payload, headers=HEADERS)
    return response


# ---------------------------------------------------------------------------
# Valid input tests
# ---------------------------------------------------------------------------


class TestValidInput:
    def test_returns_200(self):
        resp = post_recommend(VALID_PAYLOAD)
        assert resp.status_code == 200, resp.text

    def test_success_flag(self):
        data = post_recommend(VALID_PAYLOAD).json()
        assert data["success"] is True

    def test_returns_exactly_three_recommendations(self):
        data = post_recommend(VALID_PAYLOAD).json()
        recs = data["recommendations"]
        assert len(recs) == 3

    def test_ranks_are_1_2_3(self):
        data = post_recommend(VALID_PAYLOAD).json()
        ranks = [r["rank"] for r in data["recommendations"]]
        assert ranks == [1, 2, 3]

    def test_confidence_scores_non_negative(self):
        data = post_recommend(VALID_PAYLOAD).json()
        for rec in data["recommendations"]:
            assert rec["confidence"] >= 0.0

    def test_confidence_scores_at_most_1(self):
        data = post_recommend(VALID_PAYLOAD).json()
        for rec in data["confidence"] if "confidence" in data else []:
            assert rec <= 1.0
        for rec in data["recommendations"]:
            assert rec["confidence"] <= 1.0

    def test_top_confidence_sum_lte_1(self):
        data = post_recommend(VALID_PAYLOAD).json()
        total = sum(rec["confidence"] for rec in data["recommendations"])
        assert total <= 1.0 + 1e-6  # allow tiny float rounding

    def test_disclaimer_always_present(self):
        data = post_recommend(VALID_PAYLOAD).json()
        assert "disclaimer" in data
        assert len(data["disclaimer"]) > 20
        for rec in data["recommendations"]:
            assert "disclaimer" in rec
            assert len(rec["disclaimer"]) > 20

    def test_model_version_present(self):
        data = post_recommend(VALID_PAYLOAD).json()
        assert "model_version" in data
        assert data["model_version"] != ""

    def test_crop_names_are_strings(self):
        data = post_recommend(VALID_PAYLOAD).json()
        for rec in data["recommendations"]:
            assert isinstance(rec["crop"], str)
            assert len(rec["crop"]) > 0

    def test_supporting_factors_present(self):
        data = post_recommend(VALID_PAYLOAD).json()
        for rec in data["recommendations"]:
            factors = rec["supporting_factors"]
            assert isinstance(factors, list)
            assert len(factors) > 0
            for f in factors:
                assert "factor" in f
                assert "value" in f
                assert "explanation" in f

    def test_input_summary_echoed(self):
        data = post_recommend(VALID_PAYLOAD).json()
        summary = data["input_summary"]
        assert summary["N"] == VALID_PAYLOAD["N"]
        assert summary["ph"] == VALID_PAYLOAD["ph"]

    def test_data_source_note_present(self):
        data = post_recommend(VALID_PAYLOAD).json()
        assert "data_source_note" in data

    def test_language_en_accepted(self):
        payload = {**VALID_PAYLOAD, "language": "en"}
        resp = post_recommend(payload)
        assert resp.status_code == 200

    def test_language_hi_accepted(self):
        payload = {**VALID_PAYLOAD, "language": "hi"}
        resp = post_recommend(payload)
        assert resp.status_code == 200

    def test_language_as_accepted(self):
        payload = {**VALID_PAYLOAD, "language": "as"}
        resp = post_recommend(payload)
        assert resp.status_code == 200

    def test_default_language_en(self):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "language"}
        resp = post_recommend(payload)
        assert resp.status_code == 200

    def test_growing_duration_present(self):
        data = post_recommend(VALID_PAYLOAD).json()
        for rec in data["recommendations"]:
            assert rec.get("growing_duration", "") != ""


# ---------------------------------------------------------------------------
# Validation error tests
# ---------------------------------------------------------------------------


class TestValidationErrors:
    def test_negative_N_rejected(self):
        payload = {**VALID_PAYLOAD, "N": -1}
        resp = post_recommend(payload)
        assert resp.status_code == 422

    def test_N_above_300_rejected(self):
        payload = {**VALID_PAYLOAD, "N": 301}
        resp = post_recommend(payload)
        assert resp.status_code == 422

    def test_ph_above_14_rejected(self):
        payload = {**VALID_PAYLOAD, "ph": 14.5}
        resp = post_recommend(payload)
        assert resp.status_code == 422

    def test_ph_below_0_rejected(self):
        payload = {**VALID_PAYLOAD, "ph": -0.1}
        resp = post_recommend(payload)
        assert resp.status_code == 422

    def test_humidity_above_100_rejected(self):
        payload = {**VALID_PAYLOAD, "humidity": 101}
        resp = post_recommend(payload)
        assert resp.status_code == 422

    def test_temperature_above_55_rejected(self):
        payload = {**VALID_PAYLOAD, "temperature": 56}
        resp = post_recommend(payload)
        assert resp.status_code == 422

    def test_invalid_language_rejected(self):
        payload = {**VALID_PAYLOAD, "language": "fr"}
        resp = post_recommend(payload)
        assert resp.status_code == 422


class TestMissingFields:
    @pytest.mark.parametrize("field", ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"])
    def test_missing_required_field(self, field: str):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != field}
        resp = post_recommend(payload)
        assert resp.status_code == 422

    def test_empty_body_rejected(self):
        resp = client.post("/api/v1/recommend-crop", json={}, headers=HEADERS)
        assert resp.status_code == 422

