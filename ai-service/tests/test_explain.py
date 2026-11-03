"""Integration tests for POST /api/v1/explain endpoint and Gemini / Knowledge Base explanation pipeline."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.explainer import DiseaseExplainerService
from app.models.explanation import ExplanationRequest


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


class TestExplainEndpoint:
    def test_explain_early_blight_english(self, client: TestClient) -> None:
        """Generating explanation for Tomato Early Blight in English returns structured advisory."""
        payload = {
            "crop": "Tomato",
            "disease": "Early Blight (Alternaria solani)",
            "confidence": 92.5,
            "is_healthy": False,
            "status": "completed",
            "language": "en",
            "scan_id": "672728282828282828282828",
        }
        response = client.post("/api/v1/explain", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["crop"] == "Tomato"
        assert data["disease"] == "Early Blight (Alternaria solani)"
        assert data["confidence"] == 92.5
        assert "explanation" in data

        exp = data["explanation"]
        assert exp["scientific_name"] == "Alternaria solani"
        assert len(exp["symptoms"]) >= 3
        assert len(exp["causes"]) >= 1
        assert len(exp["environmental_conditions"]) >= 1
        assert len(exp["prevention"]) >= 2
        assert len(exp["sanitation"]) >= 1
        assert "treatment" in exp
        assert len(exp["treatment"]["general_approaches"]) >= 1
        assert len(exp["treatment"]["chemical_guidance"]) >= 1
        assert len(exp["treatment"]["organic_treatments"]) >= 1
        assert exp["treatment"]["when_to_seek_help"] != ""
        assert len(exp["reference_sources"]) >= 1
        assert exp["language"] == "en"

    def test_explain_healthy_crop(self, client: TestClient) -> None:
        """Generating explanation for a healthy crop returns maintenance guidance without disease chemicals."""
        payload = {
            "crop": "Potato",
            "disease": "Optimal / Healthy Foliage",
            "confidence": 98.1,
            "is_healthy": True,
            "status": "completed",
            "language": "en",
        }
        response = client.post("/api/v1/explain", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_healthy"] is True
        exp = data["explanation"]
        assert "healthy" in exp["severity_explanation"].lower() or "no disease" in exp["severity_explanation"].lower()
        assert len(exp["prevention"]) >= 1

    def test_explain_inconclusive_low_confidence(self, client: TestClient) -> None:
        """Low confidence or inconclusive scan returns safe warning and discourages chemical spraying."""
        payload = {
            "crop": "Tomato",
            "disease": "Inconclusive / Low Confidence",
            "confidence": 34.2,
            "is_healthy": False,
            "status": "inconclusive",
            "language": "en",
        }
        response = client.post("/api/v1/explain", json=payload)
        assert response.status_code == 200
        data = response.json()
        exp = data["explanation"]
        assert "inconclusive" in exp["overview"].lower()
        # Verify chemical guidance advises against spraying without confirmed diagnosis
        chemical_advice = " ".join(exp["treatment"]["chemical_guidance"]).lower()
        assert "without" in chemical_advice or "not" in chemical_advice or "no chemical" in chemical_advice

    def test_explain_multilingual_hindi(self, client: TestClient) -> None:
        """Explanation requested in Hindi returns proper language tag and disclaimer."""
        payload = {
            "crop": "Tomato",
            "disease": "Early Blight (Alternaria solani)",
            "confidence": 88.0,
            "is_healthy": False,
            "status": "completed",
            "language": "hi",
        }
        response = client.post("/api/v1/explain", json=payload)
        assert response.status_code == 200
        data = response.json()
        exp = data["explanation"]
        assert exp["language"] == "hi"
        assert len(exp["reference_sources"]) >= 1

    def test_explain_multilingual_assamese(self, client: TestClient) -> None:
        """Explanation requested in Assamese returns proper language tag and disclaimer."""
        payload = {
            "crop": "Corn (Maize)",
            "disease": "Northern Leaf Blight (Exserohilum turcicum)",
            "confidence": 85.0,
            "is_healthy": False,
            "status": "completed",
            "language": "as",
        }
        response = client.post("/api/v1/explain", json=payload)
        assert response.status_code == 200
        data = response.json()
        exp = data["explanation"]
        assert exp["language"] == "as"

    def test_missing_crop_or_disease_returns_422_or_400(self, client: TestClient) -> None:
        """Missing required fields is rejected."""
        response = client.post("/api/v1/explain", json={"crop": "", "disease": ""})
        assert response.status_code in (400, 422)

    def test_explainer_service_direct_unit(self) -> None:
        """Direct unit test of DiseaseExplainerService in knowledge-base fallback mode."""
        service = DiseaseExplainerService(api_key="", model="gemini-2.5-flash")
        req = ExplanationRequest(
            crop="Tomato",
            disease="Bacterial Spot",
            confidence=90.0,
            is_healthy=False,
            status="completed",
            language="en",
        )
        result = service.explain(req)
        assert result.scientific_name == "Xanthomonas campestris pv. vesicatoria"
        assert result.model_identifier == "krishi-knowledge-base-v1"
        assert len(result.symptoms) > 0
        assert len(result.treatment.organic_treatments) > 0

