from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from spectre.core.logger import get_logger

logger = get_logger(__name__)


@dataclass(frozen=True)
class FASInferenceResult:
    probabilities: list[float]
    inference_time_ms: int
    model_id: str
    model_version: str


class BaseFASHandler(ABC):

    @property
    @abstractmethod
    def model_id(self) -> str:
        ...

    @property
    @abstractmethod
    def version(self) -> str:
        ...

    @property
    @abstractmethod
    def is_loaded(self) -> bool:
        ...

    @property
    def supports_tta(self) -> bool:
        return False

    @abstractmethod
    def load(self, artifact_path: Path) -> None:
        ...

    @abstractmethod
    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        ...

    @abstractmethod
    def predict(self, preprocessed: np.ndarray) -> np.ndarray:
        ...

    @abstractmethod
    def postprocess(self, raw_output: np.ndarray) -> list[float]:
        ...

    def infer(self, image_bytes: bytes) -> FASInferenceResult:
        start = time.monotonic()
        preprocessed = self.preprocess(image_bytes)
        raw_output = self.predict(preprocessed)
        probabilities = self.postprocess(raw_output)
        elapsed_ms = int((time.monotonic() - start) * 1000)
        result = FASInferenceResult(
            probabilities=probabilities,
            inference_time_ms=elapsed_ms,
            model_id=self.model_id,
            model_version=self.version,
        )
        logger.debug(
            "fas_inference | model_id={} | version={} | latency_ms={} | mode=single",
            self.model_id,
            self.version,
            elapsed_ms,
        )
        return result

    def infer_tta(self, image_bytes: bytes) -> FASInferenceResult:
        raise NotImplementedError(f"{self.model_id} does not support TTA")

    def __repr__(self) -> str:
        return f"<{type(self).__name__} id={self.model_id} v={self.version} loaded={self.is_loaded}>"
