

from __future__ import annotations

import datetime
import uuid

from spectre.core.logger import get_logger
from spectre.domain.entities.auth_session import AuthSession
from spectre.domain.entities.face_profile import FaceProfile
from spectre.domain.exceptions.face_exceptions import (
    FaceAlreadyRegisteredError,
    FaceMatchFailedError,
    FaceProfileNotFoundError,
    ImageQualityInsufficientError,
    LivenessCheckFailedError,
)
from spectre.domain.ports.ml_ports import AbstractEmbeddingModel, AbstractFASModel
from spectre.domain.ports.repositories import (
    AbstractAuthSessionRepository,
    AbstractFaceProfileRepository,
)
from spectre.infrastructure.ml.image_preprocessor import ImagePreprocessor
from spectre.infrastructure.security.aes_encryption import AESEncryption

logger = get_logger(__name__)


def _extract_embedding(embed_model, image_bytes, preprocessor=None):
    try:
        return embed_model.extract_from_bytes(image_bytes)
    except NotImplementedError:
        if preprocessor is None:
            raise
        image = preprocessor.preprocess(image_bytes)
        return embed_model.extract(image)


class RegisterFace:

    def __init__(
        self,
        face_repo: AbstractFaceProfileRepository,
        session_repo: AbstractAuthSessionRepository,
        fas_model: AbstractFASModel,
        embedding_model: AbstractEmbeddingModel,
        preprocessor: ImagePreprocessor,
        encryption: AESEncryption,
    ) -> None:
        self._face_repo = face_repo
        self._session_repo = session_repo
        self._fas = fas_model
        self._embed = embedding_model
        self._prep = preprocessor
        self._enc = encryption

    async def execute(
        self,
        app_id: uuid.UUID,
        external_user_id: str,
        image_bytes: bytes,
        liveness_threshold: float = 0.5,
        metadata: dict | None = None,
    ) -> AuthSession:
        # Create session in PROCESSING state
        session = AuthSession(
            id=uuid.uuid4(), app_id=app_id,
            session_type="registration", status="PROCESSING",
            external_user_id=external_user_id, client_metadata=metadata,
        )
        session = await self._session_repo.create(session)

        try:
            # Check for existing profile
            existing = await self._face_repo.get_by_external_user(app_id, external_user_id)
            if existing:
                raise FaceAlreadyRegisteredError()

            is_valid, err = self._prep.validate_image(image_bytes)
            if not is_valid:
                raise ImageQualityInsufficientError(err)

            fas_batch, weights = self._prep.build_tta_batch(image_bytes)

            liveness = self._fas.predict_batch(fas_batch, weights, threshold=liveness_threshold)
            session.liveness_class = liveness.predicted_class
            session.liveness_confidence = liveness.confidence
            session.inference_time_ms = liveness.inference_time_ms

            if not liveness.is_live:
                if metadata and metadata.get("bypass_fas") is True:
                    logger.warning(
                        "fas_bypassed_by_client", 
                        use_case="RegisterFace",
                        user=external_user_id,
                        spoof_class=liveness.predicted_class,
                        confidence=liveness.confidence
                    )
                else:
                    session.status = "SPOOF_DETECTED"
                    session.completed_at = datetime.datetime.now(datetime.timezone.utc)
                    await self._session_repo.update(session)
                    # If predicted class is realperson but confidence too low,
                    # report the top spoof class instead for clarity
                    report_class = (
                        liveness.top_spoof_class
                        if liveness.predicted_class == "realperson"
                        else liveness.predicted_class
                    )
                    raise LivenessCheckFailedError(
                        spoof_class=report_class,
                        confidence=liveness.confidence,
                        probabilities=liveness.probabilities,
                    )

            embedding = _extract_embedding(self._embed, image_bytes, self._prep)
            encrypted = self._enc.encrypt(embedding.to_bytes())

            profile = FaceProfile(
                id=uuid.uuid4(), app_id=app_id,
                external_user_id=external_user_id,
                embedding_encrypted=encrypted,
            )
            await self._face_repo.create(profile)

            session.status = "REGISTERED"
            if session.client_metadata is None:
                session.client_metadata = {}
            session.client_metadata["liveness_metrics"] = liveness.probabilities
            session.completed_at = datetime.datetime.now(datetime.timezone.utc)
            await self._session_repo.update(session)

            logger.info("face_registered", app_id=str(app_id), user=external_user_id)
            return session

        except (FaceAlreadyRegisteredError, ImageQualityInsufficientError, LivenessCheckFailedError):
            raise
        except Exception as exc:
            session.status = "FAILED"
            session.completed_at = datetime.datetime.now(datetime.timezone.utc)
            await self._session_repo.update(session)
            logger.error("face_registration_failed", error=str(exc))
            raise


class AuthenticateFace:

    def __init__(
        self,
        face_repo: AbstractFaceProfileRepository,
        session_repo: AbstractAuthSessionRepository,
        fas_model: AbstractFASModel,
        embedding_model: AbstractEmbeddingModel,
        preprocessor: ImagePreprocessor,
        encryption: AESEncryption,
    ) -> None:
        self._face_repo = face_repo
        self._session_repo = session_repo
        self._fas = fas_model
        self._embed = embedding_model
        self._prep = preprocessor
        self._enc = encryption

    async def execute(
        self,
        app_id: uuid.UUID,
        external_user_id: str,
        image_bytes: bytes,
        liveness_threshold: float = 0.5,
        similarity_threshold: float = 0.75,
        metadata: dict | None = None,
    ) -> AuthSession:
        session = AuthSession(
            id=uuid.uuid4(), app_id=app_id,
            session_type="authentication", status="PROCESSING",
            external_user_id=external_user_id, client_metadata=metadata,
        )
        session = await self._session_repo.create(session)

        try:
            profile = await self._face_repo.get_by_external_user(app_id, external_user_id)
            if not profile:
                raise FaceProfileNotFoundError()

            is_valid, err = self._prep.validate_image(image_bytes)
            if not is_valid:
                raise ImageQualityInsufficientError(err)

            fas_batch, weights = self._prep.build_tta_batch(image_bytes)
            liveness = self._fas.predict_batch(fas_batch, weights, threshold=liveness_threshold)
            session.liveness_class = liveness.predicted_class
            session.liveness_confidence = liveness.confidence
            session.inference_time_ms = liveness.inference_time_ms

            if not liveness.is_live:
                if metadata and metadata.get("bypass_fas") is True:
                    logger.warning(
                        "fas_bypassed_by_client", 
                        use_case="AuthenticateFace",
                        user=external_user_id,
                        spoof_class=liveness.predicted_class,
                        confidence=liveness.confidence
                    )
                else:
                    session.status = "SPOOF_DETECTED"
                    session.completed_at = datetime.datetime.now(datetime.timezone.utc)
                    await self._session_repo.update(session)
                    report_class = (
                        liveness.top_spoof_class
                        if liveness.predicted_class == "realperson"
                        else liveness.predicted_class
                    )
                    raise LivenessCheckFailedError(
                        spoof_class=report_class,
                        confidence=liveness.confidence,
                        probabilities=liveness.probabilities,
                    )

            from spectre.domain.value_objects.face_embedding import FaceEmbedding

            captured = _extract_embedding(self._embed, image_bytes, self._prep)

            decrypted = self._enc.decrypt(profile.embedding_encrypted)
            stored = FaceEmbedding.from_bytes(decrypted)

            score = captured.cosine_similarity(stored)
            session.similarity_score = score
            
            logger.info(
                "face_similarity_evaluated",
                user=external_user_id,
                similarity_score=score,
                threshold_required=similarity_threshold
            )

            if score >= similarity_threshold:
                session.status = "AUTHENTICATED"
                logger.info("face_match_success", user=external_user_id, similarity_score=score)
            else:
                session.status = "REJECTED"
                session.completed_at = datetime.datetime.now(datetime.timezone.utc)
                await self._session_repo.update(session)
                logger.warning(
                    "face_match_rejected", 
                    user=external_user_id, 
                    similarity_score=score, 
                    reason="Score is below similarity threshold"
                )
                raise FaceMatchFailedError(similarity_score=score)

            if session.client_metadata is None:
                session.client_metadata = {}
            session.client_metadata["liveness_metrics"] = liveness.probabilities

            session.completed_at = datetime.datetime.now(datetime.timezone.utc)
            await self._session_repo.update(session)

            logger.info(
                "face_authenticated",
                app_id=str(app_id), user=external_user_id,
                score=round(score, 4), match=session.status == "AUTHENTICATED",
            )
            return session

        except (FaceProfileNotFoundError, ImageQualityInsufficientError, LivenessCheckFailedError, FaceMatchFailedError):
            raise
        except Exception as exc:
            session.status = "FAILED"
            session.completed_at = datetime.datetime.now(datetime.timezone.utc)
            await self._session_repo.update(session)
            logger.error("face_auth_failed", error=str(exc))
            raise


class ReplaceFace:

    def __init__(
        self,
        face_repo: AbstractFaceProfileRepository,
        session_repo: AbstractAuthSessionRepository,
        fas_model: AbstractFASModel,
        embedding_model: AbstractEmbeddingModel,
        preprocessor: ImagePreprocessor,
        encryption: AESEncryption,
    ) -> None:
        self._face_repo = face_repo
        self._session_repo = session_repo
        self._fas = fas_model
        self._embed = embedding_model
        self._prep = preprocessor
        self._enc = encryption

    async def execute(
        self,
        app_id: uuid.UUID,
        external_user_id: str,
        image_bytes: bytes,
        liveness_threshold: float = 0.5,
    ) -> AuthSession:
        session = AuthSession(
            id=uuid.uuid4(), app_id=app_id,
            session_type="replacement", status="PROCESSING",
            external_user_id=external_user_id,
        )
        session = await self._session_repo.create(session)

        profile = await self._face_repo.get_by_external_user(app_id, external_user_id)
        if not profile:
            raise FaceProfileNotFoundError()

        is_valid, err = self._prep.validate_image(image_bytes)
        if not is_valid:
            raise ImageQualityInsufficientError(err)

        fas_input = self._prep.preprocess(image_bytes)
        liveness = self._fas.predict(fas_input, threshold=liveness_threshold)
        session.liveness_class = liveness.predicted_class
        session.liveness_confidence = liveness.confidence
        session.inference_time_ms = liveness.inference_time_ms

        if not liveness.is_live:
            session.status = "SPOOF_DETECTED"
            session.completed_at = datetime.datetime.now(datetime.timezone.utc)
            await self._session_repo.update(session)
            report_class = (
                liveness.top_spoof_class
                if liveness.predicted_class == "realperson"
                else liveness.predicted_class
            )
            raise LivenessCheckFailedError(
                spoof_class=report_class, confidence=liveness.confidence,
            )

        embedding = _extract_embedding(self._embed, image_bytes, self._prep)
        profile.embedding_encrypted = self._enc.encrypt(embedding.to_bytes())
        profile.updated_at = datetime.datetime.now(datetime.timezone.utc)
        await self._face_repo.update(profile)

        session.status = "REGISTERED"
        session.completed_at = datetime.datetime.now(datetime.timezone.utc)
        await self._session_repo.update(session)
        return session


class DeleteFace:

    def __init__(self, face_repo: AbstractFaceProfileRepository) -> None:
        self._face_repo = face_repo

    async def execute(self, app_id: uuid.UUID, external_user_id: str) -> None:
        profile = await self._face_repo.get_by_external_user(app_id, external_user_id)
        if not profile:
            raise FaceProfileNotFoundError()
        await self._face_repo.delete(app_id, external_user_id)
        logger.info("face_deleted", app_id=str(app_id), user=external_user_id)


class ListFaces:

    def __init__(self, face_repo: AbstractFaceProfileRepository) -> None:
        self._face_repo = face_repo

    async def execute(
        self, app_id: uuid.UUID, offset: int = 0, limit: int = 50
    ) -> list[FaceProfile]:
        return await self._face_repo.list_by_app(app_id, offset=offset, limit=limit)


class PurgeAllFaces:

    def __init__(self, face_repo: AbstractFaceProfileRepository) -> None:
        self._face_repo = face_repo

    async def execute(self, app_id: uuid.UUID) -> int:
        deleted_count = await self._face_repo.delete_all(app_id)
        logger.warning("faces_purged", app_id=str(app_id), count=deleted_count)
        return deleted_count
