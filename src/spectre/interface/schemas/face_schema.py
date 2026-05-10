"""Face operation and session schemas."""

from __future__ import annotations

import datetime
from typing import Any

from pydantic import BaseModel, Field


class FaceRegisterRequest(BaseModel):
    external_user_id: str = Field(..., max_length=255)
    image: str  # base64-encoded JPEG/PNG, max 5MB decoded
    metadata: dict[str, Any] | None = None


class FaceAuthenticateRequest(BaseModel):
    external_user_id: str = Field(..., max_length=255)
    image: str  # base64-encoded
    metadata: dict[str, Any] | None = None


class FaceReplaceRequest(BaseModel):
    external_user_id: str = Field(..., max_length=255)
    image: str


class FaceSessionResponse(BaseModel):
    session_id: str
    status: str
    created_at: datetime.datetime


class SessionDetailResponse(BaseModel):
    session_id: str
    session_type: str
    status: str
    external_user_id: str | None
    liveness_class: str | None
    liveness_confidence: float | None
    similarity_score: float | None
    inference_time_ms: int | None
    created_at: datetime.datetime
    completed_at: datetime.datetime | None
