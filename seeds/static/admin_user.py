"""Static seeder — creates the default admin user.

Priority 10: First seed — no FK dependencies.
Creates a verified admin user with a known password for development/testing.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select

from seeds.base import BaseSeeder
from spectre.config import get_settings
from spectre.infrastructure.database.models.tables import UserModel
from spectre.infrastructure.security.password_handler import PasswordHandler


class AdminUserSeeder(BaseSeeder):
    """Seed the default admin user account."""

    name = "static.admin_user"
    priority = 10

    # Known admin credentials for development
    ADMIN_EMAIL = "admin@spectre.dev"
    ADMIN_PASSWORD = "Spectre@Admin123"
    ADMIN_DISPLAY_NAME = "Spectre Admin"

    async def run(self) -> None:
        existing = await self._session.execute(
            select(UserModel).where(UserModel.email == self.ADMIN_EMAIL)
        )
        if existing.scalar_one_or_none() is not None:
            return

        pw = PasswordHandler(get_settings())
        user = UserModel(
            id=uuid.uuid4(),
            email=self.ADMIN_EMAIL,
            password_hash=pw.hash(self.ADMIN_PASSWORD),
            display_name=self.ADMIN_DISPLAY_NAME,
            auth_provider="local",
            is_verified=True,
            is_active=True,
        )
        self._session.add(user)
