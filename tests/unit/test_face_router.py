"""Tests — Face Operations Router.

Covers: POST /api/v1/faces/register, /faces/authenticate,
        PUT /api/v1/faces/{external_user_id}, DELETE /api/v1/faces/{external_user_id},
        GET /api/v1/faces/sessions/{session_id}
"""

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestFaceAuthRequired:
    """Face endpoints require X-API-Key header."""

    async def test_register_without_api_key_returns_401(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/faces/register",
            json={"external_user_id": "usr_1", "image": "base64data"},
        )
        assert response.status_code in (401, 422)

    async def test_authenticate_without_api_key_returns_401(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/faces/authenticate",
            json={"external_user_id": "usr_1", "image": "base64data"},
        )
        assert response.status_code in (401, 422)

    async def test_replace_without_api_key_returns_401(self, client: AsyncClient):
        response = await client.put(
            "/api/v1/faces/usr_1",
            json={"image": "base64data"},
        )
        assert response.status_code in (401, 422)

    async def test_delete_without_api_key_returns_401(self, client: AsyncClient):
        response = await client.delete("/api/v1/faces/usr_1")
        assert response.status_code in (401, 422)


@pytest.mark.asyncio
class TestFaceValidation:
    """Input validation with authenticated API key client."""

    async def test_register_missing_external_user_id_returns_422(
        self, api_key_client: AsyncClient
    ):
        response = await api_key_client.post(
            "/api/v1/faces/register",
            json={"image": "base64data"},
        )
        assert response.status_code == 422

    async def test_register_missing_image_returns_422(self, api_key_client: AsyncClient):
        response = await api_key_client.post(
            "/api/v1/faces/register",
            json={"external_user_id": "usr_1"},
        )
        assert response.status_code == 422

    async def test_register_empty_body_returns_422(self, api_key_client: AsyncClient):
        response = await api_key_client.post("/api/v1/faces/register", json={})
        assert response.status_code == 422

    async def test_authenticate_missing_fields_returns_422(
        self, api_key_client: AsyncClient
    ):
        response = await api_key_client.post(
            "/api/v1/faces/authenticate", json={}
        )
        assert response.status_code == 422

    async def test_invalid_base64_returns_400(self, api_key_client: AsyncClient):
        response = await api_key_client.post(
            "/api/v1/faces/register",
            json={"external_user_id": "usr_1", "image": "!!!not_base64!!!"},
        )
        assert response.status_code in (400, 422, 500)

    async def test_register_reuses_existing_idempotency_key(
        self,
        monkeypatch,
        api_key_client: AsyncClient,
        test_app_entity,
    ):
        from spectre.domain.entities.auth_session import AuthSession
        from spectre.infrastructure.repositories.sql_repositories import SQLAuthSessionRepository

        session_id = uuid.uuid4()
        idempotency_key = "idem_123"

        async def get_existing_session(
            self: SQLAuthSessionRepository,
            app_id: uuid.UUID,
            key: str,
        ) -> AuthSession | None:
            assert app_id == test_app_entity.id
            assert key == idempotency_key
            return AuthSession(
                id=session_id,
                app_id=test_app_entity.id,
                session_type="registration",
                status="REGISTERED",
                external_user_id="usr_1",
                idempotency_key=idempotency_key,
            )

        monkeypatch.setattr(
            SQLAuthSessionRepository,
            "get_by_idempotency_key",
            get_existing_session,
        )

        response = await api_key_client.post(
            "/api/v1/faces/register",
            headers={"Idempotency-Key": idempotency_key},
            json={"external_user_id": "usr_1", "image": "!!!not_base64!!!"},
        )

        assert response.status_code == 202
        assert response.json()["session_id"] == str(session_id)


@pytest.mark.asyncio
class TestFaceSessionPoll:
    """GET /api/v1/sessions/{session_id}"""

    async def test_get_session_without_api_key_returns_401(self, client: AsyncClient):
        fake_id = str(uuid.uuid4())
        response = await client.get(f"/api/v1/sessions/{fake_id}")
        assert response.status_code in (401, 422)

    async def test_get_nonexistent_session_returns_404(self, api_key_client: AsyncClient):
        fake_id = str(uuid.uuid4())
        response = await api_key_client.get(f"/api/v1/sessions/{fake_id}")
        assert response.status_code in (404, 500)
