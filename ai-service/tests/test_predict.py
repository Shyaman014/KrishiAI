"""Integration tests for the /api/v1/predict endpoint."""

import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Create a TestClient with the full lifespan (model loaded once)."""
    with TestClient(app) as c:
        yield c


def _make_jpeg_bytes(width: int = 224, height: int = 224) -> bytes:
    """Generate a valid minimal JPEG image in memory."""
    img = Image.new("RGB", (width, height), color=(100, 160, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _make_png_bytes(width: int = 224, height: int = 224) -> bytes:
    """Generate a valid minimal PNG image in memory."""
    img = Image.new("RGB", (width, height), color=(80, 140, 60))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestPredictEndpoint:
    def test_valid_jpeg_returns_prediction(self, client: TestClient) -> None:
        """A valid JPEG image should return a structured PredictionResponse."""
        jpeg_bytes = _make_jpeg_bytes()
        response = client.post(
            "/api/v1/predict",
            files={"image": ("leaf.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "crop" in data
        assert "disease" in data
        assert "confidence" in data
        assert "status" in data
        assert data["status"] in ("completed", "inconclusive")
        assert isinstance(data["top_predictions"], list)
        assert len(data["top_predictions"]) >= 1

    def test_valid_png_returns_prediction(self, client: TestClient) -> None:
        """A valid PNG image should also return a structured PredictionResponse."""
        png_bytes = _make_png_bytes()
        response = client.post(
            "/api/v1/predict",
            files={"image": ("leaf.png", io.BytesIO(png_bytes), "image/png")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_empty_file_returns_400(self, client: TestClient) -> None:
        """An empty file should return 400."""
        response = client.post(
            "/api/v1/predict",
            files={"image": ("empty.jpg", io.BytesIO(b""), "image/jpeg")},
        )
        assert response.status_code == 400

    def test_corrupted_bytes_returns_422(self, client: TestClient) -> None:
        """Corrupted binary data that is not a valid image should return 422."""
        garbage = b"\x00\x01\x02\x03\xFF" * 100
        response = client.post(
            "/api/v1/predict",
            files={"image": ("corrupt.jpg", io.BytesIO(garbage), "image/jpeg")},
        )
        assert response.status_code == 422

    def test_text_file_disguised_as_image_returns_400(self, client: TestClient) -> None:
        """A text file sent with image MIME should be rejected at content-type validation."""
        text_data = b"this is not an image\n" * 100
        response = client.post(
            "/api/v1/predict",
            files={"image": ("fake.txt", io.BytesIO(text_data), "text/plain")},
        )
        assert response.status_code == 400

    def test_scan_id_is_echoed_back(self, client: TestClient) -> None:
        """When scan_id is provided, it should be returned in the response."""
        jpeg_bytes = _make_jpeg_bytes()
        response = client.post(
            "/api/v1/predict",
            files={"image": ("leaf.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
            data={"scan_id": "507f1f77bcf86cd799439011"},
        )
        assert response.status_code == 200
        assert response.json()["scan_id"] == "507f1f77bcf86cd799439011"

    def test_prediction_confidence_is_percentage(self, client: TestClient) -> None:
        """Confidence values must be in range 0-100."""
        jpeg_bytes = _make_jpeg_bytes()
        response = client.post(
            "/api/v1/predict",
            files={"image": ("leaf.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert 0.0 <= data["confidence"] <= 100.0
        for pred in data["top_predictions"]:
            assert 0.0 <= pred["confidence"] <= 100.0


class TestModelInfoEndpoint:
    def test_model_info_returns_metadata(self, client: TestClient) -> None:
        """GET /api/v1/model/info should return model metadata."""
        response = client.get("/api/v1/model/info")
        assert response.status_code == 200
        data = response.json()
        assert data["architecture"] == "EfficientNet-B0"
        assert data["num_classes"] == 19
        assert isinstance(data["classes"], list)
        assert len(data["classes"]) == 19
        assert 0.0 < data["confidence_threshold"] <= 1.0

    def test_health_endpoint_still_works(self, client: TestClient) -> None:
        """Health endpoint must remain accessible."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
