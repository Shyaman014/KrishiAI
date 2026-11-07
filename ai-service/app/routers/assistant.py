"""
FastAPI Router – Multilingual Agricultural Assistant (POST /api/v1/assistant/chat)

Phase 12: KrishiAI Multilingual AI Agricultural Assistant.
"""

from __future__ import annotations

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.services.assistant import AgriculturalAssistantService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Assistant"])

_assistant_service: AgriculturalAssistantService | None = None


def get_assistant_service() -> AgriculturalAssistantService:
    global _assistant_service
    if _assistant_service is None:
        _assistant_service = AgriculturalAssistantService()
    return _assistant_service


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ChatMessageItem(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessageItem] = Field(..., min_length=1)
    language: Literal["en", "hi", "as"] = Field(
        default="en",
        description="Response language: en=English, hi=Hindi, as=Assamese",
    )
    context: dict[str, Any] | None = Field(
        default=None,
        description="Optional field context (location, weather, recent scan, market rates)",
    )


class ChatResponse(BaseModel):
    success: bool = True
    reply: str
    language: str
    model: str
    is_fallback: bool


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/assistant/chat",
    response_model=ChatResponse,
    summary="Multilingual agricultural chat completion",
    description=(
        "Accepts multi-turn farmer chat messages and optional field context, "
        "returning grounded agronomic guidance in English, Hindi, or Assamese."
    ),
)
async def chat_completion(
    request: Request,
    body: ChatRequest,
) -> ChatResponse:
    """Process farmer chat inquiry and return grounded assistant answer."""
    service = get_assistant_service()

    messages_data = [{"role": m.role, "content": m.content} for m in body.messages]

    try:
        result = service.chat(
            messages=messages_data,
            language=body.language,
            context=body.context,
        )
        return ChatResponse(
            success=True,
            reply=result["reply"],
            language=result["language"],
            model=result["model"],
            is_fallback=result["is_fallback"],
        )
    except Exception as exc:
        logger.exception("AI assistant chat completion failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate AI assistant reply.",
        ) from exc

