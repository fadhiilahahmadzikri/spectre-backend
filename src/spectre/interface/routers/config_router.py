"""Configuration router — admin-only system parameter management.

Provides GET (read all config grouped by category) and PATCH (bulk update)
with immediate hot-reload into the running application state.
"""

from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request

from spectre.domain.entities.user import User
from spectre.interface.dependencies import DBSession, get_current_user
from spectre.interface.schemas.config_schema import (
    ConfigItem,
    ConfigResponse,
    ConfigUpdateRequest,
)
from spectre.infrastructure.repositories.sql_repositories import (
    SQLAuditLogRepository,
    SQLConfigRepository,
)

router = APIRouter(prefix="/admin", tags=["Configuration"])

# Settings attributes that can be hot-reloaded into app.state.settings
_SETTINGS_MAP: dict[str, str] = {
    "liveness_threshold": "liveness_threshold",
    "similarity_threshold": "similarity_threshold",
    "model_use_tta": "model_use_tta",
    "active_fas_model": "active_fas_model",
    "webhook_timeout_seconds": "webhook_timeout_seconds",
    "webhook_max_retries": "webhook_max_retries",
    "webhook_retry_backoff_base": "webhook_retry_backoff_base",
    "rate_limit_default": "rate_limit_default",
    "rate_limit_face_operations": "rate_limit_face_operations",
    "jwt_access_token_expire_minutes": "jwt_access_token_expire_minutes",
    "jwt_refresh_token_expire_days": "jwt_refresh_token_expire_days",
    "otp_expire_minutes": "otp_expire_minutes",
    "otp_length": "otp_length",
}


def _cast_value(value: str, data_type: str):
    """Cast string value to the appropriate Python type."""
    if data_type == "int":
        return int(value)
    if data_type == "float":
        return float(value)
    if data_type == "bool":
        return value.lower() in ("true", "1", "yes")
    return value


@router.get("/config", response_model=ConfigResponse)
async def get_config(
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Retrieve all system configuration parameters grouped by category."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    repo = SQLConfigRepository(db)
    rows = await repo.get_all()

    categories: dict[str, list[ConfigItem]] = defaultdict(list)
    for row in rows:
        categories[row["category"]].append(ConfigItem(**row))

    return ConfigResponse(categories=dict(categories))


@router.patch("/config", response_model=ConfigResponse)
async def update_config(
    request: Request,
    body: ConfigUpdateRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
):
    """Bulk update configuration values with immediate hot-reload.

    Accepts a dict of {key: new_value} pairs. Only existing keys are updated.
    Changes are audited and propagated to the running application state.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    if not body.updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    repo = SQLConfigRepository(db)
    audit_repo = SQLAuditLogRepository(db)
    settings = request.app.state.settings

    for key, new_value in body.updates.items():
        existing = await repo.get_by_key(key)
        if not existing:
            continue

        if key == "active_fas_model":
            fas_registry = getattr(request.app.state, "fas_registry", None)
            if fas_registry is None or not fas_registry.is_valid_model_id(new_value):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error_code": "INVALID_MODEL_ID",
                        "message": f"Unknown or unloaded FAS model: {new_value}",
                    },
                )

        old_value = existing["value"]
        await repo.update_value(key, new_value, updated_by=current_user.id)

        # Audit trail
        await audit_repo.append(
            event_type="config.updated",
            user_id=current_user.id,
            resource_type="system_config",
            resource_id=key,
            metadata={"old_value": old_value, "new_value": new_value},
        )

        # Hot-reload into running settings
        if key in _SETTINGS_MAP:
            attr = _SETTINGS_MAP[key]
            setattr(settings, attr, _cast_value(new_value, existing["data_type"]))

    # Return updated state
    rows = await repo.get_all()
    categories: dict[str, list[ConfigItem]] = defaultdict(list)
    for row in rows:
        categories[row["category"]].append(ConfigItem(**row))

    return ConfigResponse(categories=dict(categories))



@router.get("/fas-models")
async def list_fas_models(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    fas_registry = getattr(request.app.state, "fas_registry", None)
    settings = request.app.state.settings

    if fas_registry is None:
        return {
            "active_model_id": settings.active_fas_model,
            "loaded_count": 0,
            "models": [],
        }

    entries = fas_registry.list_models()
    for entry in entries:
        entry["is_active"] = entry["model_id"] == settings.active_fas_model

    return {
        "active_model_id": settings.active_fas_model,
        "loaded_count": fas_registry.loaded_count,
        "models": entries,
    }
