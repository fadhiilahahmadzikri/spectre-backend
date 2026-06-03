"""Unit tests for security utilities."""

from __future__ import annotations

import datetime
import uuid

import pytest

from spectre.config import Settings
from spectre.domain.exceptions.auth_exceptions import InvalidTokenError
from spectre.infrastructure.security.jwt_handler import JWTHandler
from spectre.infrastructure.security.api_key_generator import ApiKeyGenerator
from spectre.infrastructure.security.password_handler import PasswordHandler
from spectre.interface.dependencies import _api_key_is_expired, _client_ip_allowed


@pytest.fixture
def settings():
    return Settings(
        bcrypt_cost=4,  # Fast for tests
        api_key_length=48,
        encryption_key="dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleTE=",
    )


class TestPasswordHandler:
    def test_hash_and_verify(self, settings):
        handler = PasswordHandler(settings)
        password = "SecurePassword123!"
        hashed = handler.hash(password)
        assert hashed != password
        assert handler.verify(password, hashed)

    def test_wrong_password_fails(self, settings):
        handler = PasswordHandler(settings)
        hashed = handler.hash("correct_password")
        assert not handler.verify("wrong_password", hashed)


class TestApiKeyGenerator:
    def test_generate_key_format(self, settings):
        gen = ApiKeyGenerator(settings)
        pair = gen.generate()
        assert pair.full_key.startswith("spk_")
        assert len(pair.prefix) == 12
        assert pair.key_hash.startswith("$2")

    def test_verify_key(self, settings):
        gen = ApiKeyGenerator(settings)
        pair = gen.generate()
        assert gen.verify(pair.full_key, pair.key_hash)

    def test_wrong_key_fails(self, settings):
        gen = ApiKeyGenerator(settings)
        pair = gen.generate()
        assert not gen.verify("spk_wrong_key", pair.key_hash)


class TestJWTHandler:
    def test_access_token_user_id_is_accepted(self, settings):
        handler = JWTHandler(settings)
        user_id = uuid.uuid4()
        token = handler.create_access_token(user_id)

        assert handler.get_user_id(token) == user_id

    def test_challenge_token_is_rejected_as_access_token(self, settings):
        handler = JWTHandler(settings)
        token = handler.create_access_token(
            uuid.uuid4(),
            extra_claims={"type": "totp_challenge"},
        )

        with pytest.raises(InvalidTokenError):
            handler.get_user_id(token)

    def test_expected_challenge_type_is_accepted(self, settings):
        handler = JWTHandler(settings)
        token = handler.create_access_token(
            uuid.uuid4(),
            extra_claims={"type": "totp_challenge"},
        )

        payload = handler.decode_token(token, expected_type="totp_challenge")

        assert payload["type"] == "totp_challenge"


class TestApiKeyRequestPolicy:
    def test_api_key_expiry_accepts_missing_expiration(self):
        assert not _api_key_is_expired(None)

    def test_api_key_expiry_rejects_past_expiration(self):
        expires_at = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=1)

        assert _api_key_is_expired(expires_at)

    def test_client_ip_allowlist_accepts_exact_and_cidr_matches(self):
        assert _client_ip_allowed("203.0.113.10", ["203.0.113.10"])
        assert _client_ip_allowed("203.0.113.10", ["203.0.113.0/24"])

    def test_client_ip_allowlist_rejects_non_matches(self):
        assert not _client_ip_allowed("203.0.113.10", ["198.51.100.0/24"])
