"""Google OAuth use cases — exchange profile for user account."""

from __future__ import annotations

import datetime
import uuid
from typing import Any

from spectre.core.logger import get_logger
from spectre.domain.entities.user import User
from spectre.domain.ports.repositories import AbstractUserRepository

logger = get_logger(__name__)


class GoogleOAuthUseCase:
    """Handle Google OAuth profile to local user conversion."""

    def __init__(self, user_repo: AbstractUserRepository) -> None:
        self._user_repo = user_repo

    async def execute(self, profile: dict[str, Any]) -> User:
        """Create or retrieve a user based on Google profile data."""
        google_id = profile.get("sub")
        email = profile.get("email")
        display_name = profile.get("name")

        if not google_id or not email:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400, 
                detail={"error_code": "INVALID_OAUTH_PROFILE", "message": "Google profile missing required fields."}
            )

        # 1. Try finding by Google ID
        user = await self._user_repo.get_by_google_id(google_id)
        if user:
            logger.info("google_oauth_login_existing_id", user_id=str(user.id), email=email)
            return user

        # 2. Try finding by Email (link existing local account)
        user = await self._user_repo.get_by_email(email.lower())
        if user:
            # Update user to link Google ID
            user.google_id = google_id
            user.auth_provider = "google"
            user.updated_at = datetime.datetime.now(datetime.timezone.utc)
            # Auto-verify if they used Google
            user.is_verified = True
            await self._user_repo.update(user)
            logger.info("google_oauth_linked_account", user_id=str(user.id), email=email)
            return user

        # 3. Create new user
        user = User(
            id=uuid.uuid4(),
            email=email.lower(),
            password_hash=None, # No local password
            display_name=display_name,
            auth_provider="google",
            google_id=google_id,
            is_verified=True, # Google accounts are trusted/verified
            is_active=True,
        )
        user = await self._user_repo.create(user)
        logger.info("google_oauth_new_user", user_id=str(user.id), email=email)
        return user
