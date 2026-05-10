"""Face operations router — register, authenticate, replace, delete, session poll.

All endpoints from API_SPECIFICATION.md §4.5 and §4.6.
All use X-API-Key authentication (not JWT Bearer).
"""

from __future__ import annotations

import base64
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from spectre.config import Settings
from spectre.domain.exceptions.face_exceptions import (
    FaceAlreadyRegisteredError,
    FaceProfileNotFoundError,
    ImageQualityInsufficientError,
    LivenessCheckFailedError,
)
from spectre.interface.dependencies import (
    AuthenticatedApp,
    DBSession,
    check_rate_limit,
    get_settings,
)
from spectre.interface.schemas.face_schema import (
    FaceAuthenticateRequest,
    FaceRegisterRequest,
    FaceReplaceRequest,
    FaceSessionResponse,
    SessionDetailResponse,
)
from spectre.infrastructure.repositories.sql_repositories import (
    SQLAuthSessionRepository,
    SQLFaceProfileRepository,
)

router = APIRouter(
    prefix="/api/v1",
    tags=["Face Operations"],
    dependencies=[Depends(check_rate_limit)],
)


def _build_face_use_case(request: Request, db, app, use_case_class):
    settings: Settings = request.app.state.settings
    registry = request.app.state.model_registry

    if registry is None:
        raise HTTPException(
            status_code=503,
            detail={"error_code": "MODEL_UNAVAILABLE", "message": "ML model not loaded."},
        )

    from spectre.infrastructure.ml.fas_adapter import KerasFASAdapter
    from spectre.infrastructure.ml.image_preprocessor import ImagePreprocessor
    from spectre.infrastructure.security.aes_encryption import AESEncryption

    face_repo = SQLFaceProfileRepository(db)
    session_repo = SQLAuthSessionRepository(db)
    fas_adapter = KerasFASAdapter(registry)
    preprocessor = ImagePreprocessor(settings)
    encryption = AESEncryption(settings)

    insightface_reg = getattr(request.app.state, "insightface_registry", None)
    if insightface_reg is not None and insightface_reg.is_loaded:
        from spectre.infrastructure.ml.insightface_embedding_adapter import InsightFaceEmbeddingAdapter
        embed_adapter = InsightFaceEmbeddingAdapter(insightface_reg)
    else:
        from spectre.infrastructure.ml.embedding_adapter import KerasEmbeddingAdapter
        embed_adapter = KerasEmbeddingAdapter(registry)

    return use_case_class(
        face_repo=face_repo,
        session_repo=session_repo,
        fas_model=fas_adapter,
        embedding_model=embed_adapter,
        preprocessor=preprocessor,
        encryption=encryption,
    )


def _decode_image(image_b64: str) -> bytes:
    """Decode base64 image and validate size."""
    try:
        data = base64.b64decode(image_b64)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail={"error_code": "VALIDATION_ERROR", "message": "Invalid base64 image data."},
        )
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail={"error_code": "IMAGE_TOO_LARGE", "message": "Decoded image exceeds 5MB limit."},
        )
    return data


@router.post("/faces/register", status_code=202, response_model=FaceSessionResponse)
async def register_face(
    request: Request,
    body: FaceRegisterRequest,
    db: DBSession,
    app: AuthenticatedApp,
) -> dict:
    """Submit a face image for liveness detection and enrollment.

    Returns a session ID that can be polled or received via webhook.
    """
    from spectre.application.face_use_cases import RegisterFace

    image_bytes = _decode_image(body.image)
    use_case = _build_face_use_case(request, db, app, RegisterFace)

    session = await use_case.execute(
        app_id=app.id,
        external_user_id=body.external_user_id,
        image_bytes=image_bytes,
        liveness_threshold=app.liveness_threshold,
        metadata=body.metadata,
    )

    # Trigger webhook asynchronously
    _dispatch_webhook(request, app, session)

    return {
        "session_id": str(session.id),
        "status": session.status.lower(),
        "created_at": session.created_at or datetime.datetime.now(datetime.timezone.utc),
    }


@router.post("/faces/authenticate", status_code=202, response_model=FaceSessionResponse)
async def authenticate_face(
    request: Request,
    body: FaceAuthenticateRequest,
    db: DBSession,
    app: AuthenticatedApp,
) -> dict:
    """Submit a face image for liveness + identity verification.

    Returns a session ID that can be polled or received via webhook.
    """
    from spectre.application.face_use_cases import AuthenticateFace

    image_bytes = _decode_image(body.image)
    use_case = _build_face_use_case(request, db, app, AuthenticateFace)

    session = await use_case.execute(
        app_id=app.id,
        external_user_id=body.external_user_id,
        image_bytes=image_bytes,
        liveness_threshold=app.liveness_threshold,
        similarity_threshold=app.similarity_threshold,
        metadata=body.metadata,
    )

    _dispatch_webhook(request, app, session)

    return {
        "session_id": str(session.id),
        "status": session.status.lower(),
        "created_at": session.created_at or datetime.datetime.now(datetime.timezone.utc),
    }


@router.put("/faces/{external_user_id}", status_code=202, response_model=FaceSessionResponse)
async def replace_face(
    request: Request,
    external_user_id: str,
    db: DBSession,
    app: AuthenticatedApp,
) -> dict:
    """Replace an existing face profile with a new biometric template."""
    from spectre.application.face_use_cases import ReplaceFace

    body = await request.json()
    image_b64 = body.get("image_base64") or body.get("image", "")
    image_bytes = _decode_image(image_b64)

    use_case = _build_face_use_case(request, db, app, ReplaceFace)

    session = await use_case.execute(
        app_id=app.id,
        external_user_id=external_user_id,
        image_bytes=image_bytes,
        liveness_threshold=app.liveness_threshold,
    )

    _dispatch_webhook(request, app, session)

    return {
        "session_id": str(session.id),
        "status": session.status.lower(),
        "created_at": session.created_at or datetime.datetime.now(datetime.timezone.utc),
    }


@router.get("/faces", status_code=200, response_model=dict)
async def list_faces(

    db: DBSession,
    app: AuthenticatedApp,
    offset: int = 0,
    limit: int = 100,
) -> dict:
    """List all registered face profiles."""
    from spectre.application.face_use_cases import ListFaces

    face_repo = SQLFaceProfileRepository(db)
    use_case = ListFaces(face_repo=face_repo)
    profiles = await use_case.execute(app_id=app.id, offset=offset, limit=limit)
    
    return {
        "count": len(profiles),
        "profiles": [
            {
                "external_user_id": p.external_user_id,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in profiles
        ],
    }


@router.delete("/faces", status_code=200)
async def purge_faces(
    db: DBSession,
    app: AuthenticatedApp,
) -> dict:
    """Purge all face profiles for the application."""
    from spectre.application.face_use_cases import PurgeAllFaces

    face_repo = SQLFaceProfileRepository(db)
    use_case = PurgeAllFaces(face_repo=face_repo)
    count = await use_case.execute(app_id=app.id)
    return {"purged_count": count, "message": "All faces purged successfully."}


@router.delete("/faces/{external_user_id}", status_code=204)
async def delete_face(
    external_user_id: str,
    db: DBSession,
    app: AuthenticatedApp,
) -> None:
    """Delete a face profile."""
    from spectre.application.face_use_cases import DeleteFace

    face_repo = SQLFaceProfileRepository(db)
    use_case = DeleteFace(face_repo=face_repo)
    await use_case.execute(app_id=app.id, external_user_id=external_user_id)
    return None


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session(
    session_id: uuid.UUID,
    db: DBSession,
    app: AuthenticatedApp,
) -> dict:
    """Poll session status (fallback when webhook fails)."""
    session_repo = SQLAuthSessionRepository(db)
    session = await session_repo.get_by_id(session_id)

    if not session or session.app_id != app.id:
        raise HTTPException(status_code=404, detail="Session not found.")

    return {
        "session_id": str(session.id),
        "session_type": session.session_type,
        "status": session.status.lower(),
        "external_user_id": session.external_user_id,
        "liveness_class": session.liveness_class,
        "liveness_confidence": session.liveness_confidence,
        "similarity_score": session.similarity_score,
        "inference_time_ms": session.inference_time_ms,
        "created_at": session.created_at or datetime.datetime.now(datetime.timezone.utc),
        "completed_at": session.completed_at,
    }


def _dispatch_webhook(request: Request, app, session) -> None:
    """Fire-and-forget webhook dispatch via Celery."""
    if not app.has_webhook:
        return

    try:
        from spectre.workers.tasks.webhook_task import deliver_webhook

        deliver_webhook.delay(
            str(session.id),
            str(app.id),
        )
    except Exception:
        pass  # Webhook dispatch failure is non-fatal
