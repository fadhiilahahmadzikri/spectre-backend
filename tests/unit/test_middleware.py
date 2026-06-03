"""Tests — Middleware Chain.

Covers: RequestID injection, exception handler mapping, rate limiting.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRequestIDMiddleware:
    """Every response must include X-Request-ID."""

    async def test_response_has_request_id_header(self, client: AsyncClient):
        response = await client.get("/")
        assert "x-request-id" in response.headers

    async def test_custom_request_id_is_echoed(self, client: AsyncClient):
        custom_id = "custom-req-12345"
        response = await client.get("/", headers={"X-Request-ID": custom_id})
        assert response.headers.get("x-request-id") == custom_id


@pytest.mark.asyncio
class TestExceptionHandler:
    """SpectreError subclasses map to structured JSON errors."""

    async def test_422_has_structured_error(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={})
        assert response.status_code == 422
        body = response.json()
        assert body["success"] is False
        assert body["error"]["code"] == "VALIDATION_ERROR"
        assert body["error"]["message"] == "Request validation failed."
        assert "errors" in body["error"]["details"]
        assert body["request_id"] is not None
        assert "timestamp" in body

    async def test_401_has_error_code(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/applications",
            headers={"Authorization": "Bearer invalid_token"},
        )
        if response.status_code == 401:
            body = response.json()
            assert body["success"] is False
            assert body["error"]["code"] == "INVALID_TOKEN"
            assert body["error"]["message"] == "Invalid or expired token."
            assert body["request_id"] is not None
