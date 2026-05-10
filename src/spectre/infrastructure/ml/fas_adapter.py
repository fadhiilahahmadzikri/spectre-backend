"""FAS model adapter — implements AbstractFASModel using the ModelRegistry."""

from __future__ import annotations

import time

import numpy as np

from spectre.domain.exceptions.face_exceptions import ModelInferenceError
from spectre.domain.ports.ml_ports import AbstractFASModel
from spectre.domain.value_objects.liveness_result import LivenessResult
from spectre.infrastructure.ml.model_registry import ModelRegistry


class KerasFASAdapter(AbstractFASModel):
    """Adapts the ModelRegistry's classification output to the domain port."""

    def __init__(self, registry: ModelRegistry) -> None:
        self._registry = registry

    def predict(self, image: np.ndarray, *, threshold: float = 0.5) -> LivenessResult:
        """Run FAS inference and return a LivenessResult.

        Args:
            image: Preprocessed float32 array of shape (256, 256, 3).
            threshold: Minimum 'realperson' probability for is_live=True.

        Returns:
            LivenessResult with 6-class probabilities.

        Raises:
            ModelInferenceError: If inference fails.
        """
        try:
            start = time.monotonic()
            probs = self._registry.classify(image)
            elapsed_ms = int((time.monotonic() - start) * 1000)

            # Handle batch output — take first result
            if probs.ndim == 2:
                probs = probs[0]

            return LivenessResult.from_probabilities(
                probabilities=probs.tolist(),
                threshold=threshold,
                inference_time_ms=elapsed_ms,
            )
        except Exception as exc:
            raise ModelInferenceError(
                f"FAS inference failed: {exc}"
            ) from exc

    def predict_batch(self, images: np.ndarray, weights: list[float] | None = None, *, threshold: float = 0.5) -> LivenessResult:
        """Run FAS inference on a batch of preprocessed images and average the results."""
        try:
            start = time.monotonic()
            all_probs = self._registry.classify(images)
            elapsed_ms = int((time.monotonic() - start) * 1000)

            if weights is not None:
                probs = np.average(all_probs, axis=0, weights=np.array(weights))
            else:
                probs = np.average(all_probs, axis=0)

            return LivenessResult.from_probabilities(
                probabilities=probs.tolist(),
                threshold=threshold,
                inference_time_ms=elapsed_ms,
            )
        except Exception as exc:
            raise ModelInferenceError(
                f"FAS batch inference failed: {exc}"
            ) from exc
