"""Abstract ML model ports — define inference contracts.

The infrastructure layer provides Keras-based implementations.
Domain and application layers depend only on these abstractions.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

import numpy as np

from spectre.domain.value_objects.face_embedding import FaceEmbedding
from spectre.domain.value_objects.liveness_result import LivenessResult


class AbstractFASModel(ABC):
    """Contract for Face Anti-Spoofing (liveness detection) model.

    Accepts a preprocessed image array and returns a LivenessResult
    with the 6-class classification output.
    """

    @abstractmethod
    def predict(self, image: np.ndarray, *, threshold: float = 0.5) -> LivenessResult:
        """Run FAS inference on a preprocessed image.

        Args:
            image: Preprocessed float32 array of shape (256, 256, 3).
                   Normalized with ImageNet mean/std, clipped to ±2.5.
            threshold: Minimum 'realperson' probability for is_live=True.

        Returns:
            LivenessResult with full 6-class probabilities.
        """
        ...

    @abstractmethod
    def predict_batch(self, images: np.ndarray, weights: list[float] | None = None, *, threshold: float = 0.5) -> LivenessResult:
        """Run FAS inference on a batch of preprocessed images (TTA).

        Args:
            images: Preprocessed float32 array of shape (N, 256, 256, 3).
            weights: Optional list of weights for weighted average of probabilities.
            threshold: Minimum 'realperson' probability for is_live=True.

        Returns:
            LivenessResult with averaged 6-class probabilities.
        """
        ...


class AbstractEmbeddingModel(ABC):

    @abstractmethod
    def extract(self, image: np.ndarray) -> FaceEmbedding:
        ...

    def extract_from_bytes(self, image_bytes: bytes) -> FaceEmbedding:
        raise NotImplementedError
