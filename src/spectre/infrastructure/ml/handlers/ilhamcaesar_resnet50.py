from __future__ import annotations

import io
import time
from pathlib import Path

import numpy as np
from PIL import Image

from spectre.config import Settings
from spectre.core.logger import get_logger
from spectre.infrastructure.ml.handlers.base import BaseFASHandler

logger = get_logger(__name__)

_MODEL_ID = "ilhamcaesar_resnet50"
_VERSION = "1.2"
_IMG_SIZE = 224


class IlhamCaesarResNet50Handler(BaseFASHandler):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model = None
        self._predict_fn = None

    @property
    def model_id(self) -> str:
        return _MODEL_ID

    @property
    def version(self) -> str:
        return _VERSION

    @property
    def is_loaded(self) -> bool:
        return self._model is not None and self._predict_fn is not None

    @property
    def supports_tta(self) -> bool:
        return False

    def load(self, artifact_path: Path) -> None:
        path = Path(artifact_path)
        if not path.exists():
            raise FileNotFoundError(f"IlhamCaesar ResNet50 artifact not found: {path}")

        import keras
        import tensorflow as tf

        logger.info(
            "fas_handler_loading | model_id={} | version={} | path={}",
            self.model_id,
            self.version,
            str(path),
        )
        start = time.monotonic()

        self._model = keras.saving.load_model(str(path), compile=False)

        model_ref = self._model

        @tf.function(jit_compile=False, reduce_retracing=True)
        def _predict_fn(x: "tf.Tensor") -> "tf.Tensor":
            return model_ref(x, training=False)

        self._predict_fn = _predict_fn
        _ = self._predict_fn(tf.zeros((1, _IMG_SIZE, _IMG_SIZE, 3), dtype=tf.float32))

        elapsed = time.monotonic() - start
        logger.info(
            "fas_handler_loaded | model_id={} | version={} | elapsed_sec={}",
            self.model_id,
            self.version,
            round(elapsed, 2),
        )

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        from tensorflow.keras.applications.resnet50 import preprocess_input

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((_IMG_SIZE, _IMG_SIZE), Image.Resampling.BICUBIC)
        arr = np.array(img).astype(np.float32)
        arr = preprocess_input(arr)
        arr = np.expand_dims(arr, axis=0)
        return arr.astype(np.float32)

    def predict(self, preprocessed: np.ndarray) -> np.ndarray:
        import tensorflow as tf

        if self._predict_fn is None:
            raise RuntimeError(f"{self.model_id} is not loaded; call load() first.")
        tensor = tf.constant(preprocessed, dtype=tf.float32)
        out = self._predict_fn(tensor)
        return out.numpy()

    def postprocess(self, raw_output: np.ndarray) -> list[float]:
        probs = raw_output
        if probs.ndim == 2:
            probs = probs[0]
        sum_val = float(np.sum(probs))
        if abs(sum_val - 1.0) > 1e-2:
            logger.warning(
                "fas_probs_not_normalized | model_id={} | sum={}",
                self.model_id,
                sum_val,
            )
        return probs.tolist()
