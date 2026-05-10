"""Application and API key schemas."""

from __future__ import annotations

import datetime

from pydantic import BaseModel, Field


class CreateApplicationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    webhook_url: str | None = None


class UpdateApplicationRequest(BaseModel):
    name: str | None = Field(None, max_length=255)
    webhook_url: str | None = None
    liveness_threshold: float | None = Field(None, ge=0.0, le=1.0)
    similarity_threshold: float | None = Field(None, ge=0.0, le=1.0)
    allowed_ips: list[str] | None = None


class ApplicationResponse(BaseModel):
    id: str
    name: str
    webhook_url: str | None
    liveness_threshold: float
    similarity_threshold: float
    allowed_ips: list[str]
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime


class GenerateApiKeyRequest(BaseModel):
    label: str | None = Field(None, max_length=255)


class ApiKeyResponse(BaseModel):
    id: str
    key_prefix: str
    label: str | None
    status: str
    last_used_at: datetime.datetime | None
    created_at: datetime.datetime


class ApiKeyCreatedResponse(ApiKeyResponse):
    full_key: str  # Returned exactly once
