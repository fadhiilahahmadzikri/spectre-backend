"""EmailVerification entity — single-use OTP for email ownership confirmation."""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from uuid import UUID


@dataclass
class EmailVerification:
    """Represents a single-use email verification OTP record.

    The raw OTP is never stored — only its bcrypt hash.
    Expired or used records are cleaned up by a scheduled job.
    """

    id: UUID
    user_id: UUID
    otp_hash: str
    is_used: bool = False
    expires_at: datetime.datetime = field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(minutes=15)
    )
    created_at: datetime.datetime = field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc)
    )

    @property
    def is_expired(self) -> bool:
        return datetime.datetime.now(datetime.timezone.utc) > self.expires_at
