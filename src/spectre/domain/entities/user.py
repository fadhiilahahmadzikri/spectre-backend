"""User entity — tenant account holder."""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from typing import Literal
from uuid import UUID


@dataclass
class User:
    """Represents a tenant account holder who manages applications."""

    id: UUID
    email: str
    password_hash: str | None
    display_name: str | None = None
    auth_provider: Literal["local", "google"] = "local"
    google_id: str | None = None
    totp_secret_encrypted: str | None = None
    totp_enabled: bool = False
    is_verified: bool = False
    is_active: bool = True
    created_at: datetime.datetime = field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = field(default_factory=datetime.datetime.utcnow)

    @property
    def requires_totp(self) -> bool:
        """Check if user has TOTP enabled and must verify during login."""
        return self.totp_enabled and self.totp_secret_encrypted is not None
