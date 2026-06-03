"""Exception handlers — map public API errors to a stable envelope."""

from __future__ import annotations

import datetime
from http import HTTPStatus
from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from spectre.domain.exceptions.base import SpectreError


def _timestamp() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def _code_from_status(status_code: int) -> str:
    if status_code == 422:
        return "VALIDATION_ERROR"
    if status_code == 429:
        return "RATE_LIMIT_EXCEEDED"
    try:
        return HTTPStatus(status_code).phrase.upper().replace(" ", "_")
    except ValueError:
        return "HTTP_ERROR"


def _message_from_status(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return "HTTP error"


def _error_response(
    request: Request,
    *,
    status_code: int,
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details,
            },
            "request_id": _request_id(request),
            "timestamp": _timestamp(),
        },
    )


def _normalize_http_detail(
    detail: Any,
    status_code: int,
) -> tuple[str, str, dict[str, Any] | None]:
    if isinstance(detail, dict):
        code = str(detail.get("code") or detail.get("error_code") or _code_from_status(status_code))
        message = str(detail.get("message") or detail.get("detail") or _message_from_status(status_code))
        details = detail.get("details")
        return code, message, details if isinstance(details, dict) else None

    if isinstance(detail, str):
        return _code_from_status(status_code), detail, None

    return _code_from_status(status_code), _message_from_status(status_code), {"detail": detail}


async def spectre_exception_handler(request: Request, exc: SpectreError) -> JSONResponse:
    """Convert SpectreError subclasses into standard error responses."""
    return _error_response(
        request,
        status_code=exc.http_status,
        code=exc.error_code,
        message=exc.message,
        details=exc.details,
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    """Convert FastAPI/Starlette HTTPException into standard error responses."""
    code, message, details = _normalize_http_detail(exc.detail, exc.status_code)
    return _error_response(
        request,
        status_code=exc.status_code,
        code=code,
        message=message,
        details=details,
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Convert request validation failures into standard error responses."""
    return _error_response(
        request,
        status_code=422,
        code="VALIDATION_ERROR",
        message="Request validation failed.",
        details={"errors": exc.errors()},
    )
