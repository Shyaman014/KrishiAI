"""
Tests for the AI Assistant Chat endpoint – Phase 12.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.assistant import AgriculturalAssistantService

client = TestClient(app)


class TestAssistantEndpoint:
    def test_english_chat_success(self):
        payload = {
            "messages": [
                {"role": "user", "content": "How do I control aphids in my mustard crop?"}
            ],
            "language": "en",
        }
        res = client.post("/api/v1/assistant/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert "reply" in data
        assert len(data["reply"]) > 10
        assert data["language"] == "en"

    def test_hindi_chat_success(self):
        payload = {
            "messages": [
                {"role": "user", "content": "गेहूं में पीला रतुआ का इलाज क्या है?"}
            ],
            "language": "hi",
        }
        res = client.post("/api/v1/assistant/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["language"] == "hi"
        assert len(data["reply"]) > 10

    def test_assamese_chat_success(self):
        payload = {
            "messages": [
                {"role": "user", "content": "সৰিয়হত পোক নিয়ন্ত্ৰণ কেনেকৈ কৰিব লাগে?"}
            ],
            "language": "as",
        }
        res = client.post("/api/v1/assistant/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["language"] == "as"
        assert len(data["reply"]) > 10

    def test_multi_turn_conversation_context(self):
        payload = {
            "messages": [
                {"role": "user", "content": "My wheat crop is 45 days old."},
                {"role": "assistant", "content": "At 45 days, wheat is in the tillering to jointing stage."},
                {"role": "user", "content": "What fertilizer dose is recommended now?"},
            ],
            "language": "en",
            "context": {"location": "Ludhiana, Punjab", "weather": "Sunny, 24°C"},
        }
        res = client.post("/api/v1/assistant/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "reply" in data
        assert len(data["reply"]) > 10

    def test_empty_messages_returns_422(self):
        payload = {"messages": [], "language": "en"}
        res = client.post("/api/v1/assistant/chat", json=payload)
        assert res.status_code == 422

    def test_invalid_language_returns_422(self):
        payload = {
            "messages": [{"role": "user", "content": "Hello"}],
            "language": "es",
        }
        res = client.post("/api/v1/assistant/chat", json=payload)
        assert res.status_code == 422


class TestAssistantServiceDirect:
    def test_service_unit_fallback(self):
        svc = AgriculturalAssistantService(api_key=None)
        res = svc.chat(
            messages=[{"role": "user", "content": "Tell me about wheat rust disease"}],
            language="en",
        )
        assert res["is_fallback"] is True
        assert "rust" in res["reply"].lower()
        assert res["language"] == "en"

