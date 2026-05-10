"""SMTP email mailer — sends templated emails via aiosmtplib."""

from __future__ import annotations

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

import aiosmtplib
from jinja2 import Environment, FileSystemLoader

from spectre.config import Settings
from spectre.core.logger import get_logger

logger = get_logger(__name__)

TEMPLATE_DIR = Path(__file__).parent / "templates"


class SMTPMailer:
    """Sends HTML emails via SMTP with Jinja2 templates."""

    def __init__(self, settings: Settings) -> None:
        self._host = settings.smtp_host
        self._port = settings.smtp_port
        self._username = settings.smtp_username
        self._password = settings.smtp_password
        self._use_tls = settings.smtp_use_tls
        self._from_email = settings.smtp_from_email
        self._from_name = settings.smtp_from_name

        self._jinja = Environment(
            loader=FileSystemLoader(str(TEMPLATE_DIR)),
            autoescape=True,
        )

    async def send_verification_email(
        self, to_email: str, otp_code: str, display_name: str | None = None
    ) -> None:
        """Send an email verification OTP."""
        subject = f"[{self._from_name}] Email Verification Code"
        html = self._jinja.get_template("email_verification.html").render(
            otp_code=otp_code,
            display_name=display_name or to_email,
            app_name=self._from_name,
        )
        await self._send(to_email, subject, html)

    async def _send(self, to_email: str, subject: str, html_body: str) -> None:
        """Send an HTML email."""
        message = MIMEMultipart("alternative")
        message["From"] = f"{self._from_name} <{self._from_email}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(html_body, "html"))

        try:
            await aiosmtplib.send(
                message,
                hostname=self._host,
                port=self._port,
                username=self._username,
                password=self._password,
                use_tls=self._use_tls,
            )
            logger.info("email_sent", to=to_email, subject=subject)
        except Exception as exc:
            logger.error("email_send_failed", to=to_email, error=str(exc))
            # Don't raise — email failures should not block the main flow
