import json
from pathlib import Path
from typing import Any

import joblib


BACKEND_DIR = Path(__file__).resolve().parents[2]
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"
MODEL_PATH = TRAINED_MODELS_DIR / "shot_xgboost_model.pkl"
METADATA_PATH = TRAINED_MODELS_DIR / "model_metadata.json"

# Module-level caches avoid reloading model artifacts on every API request.
_shot_model: Any | None = None
_model_loaded = False
_model_metadata: dict[str, Any] | None = None


def load_shot_model() -> Any | None:
    """
    Load the trained ShotOptix XGBoost model.

    Returns None when the model file is missing or cannot be loaded so callers
    can continue using the Phase 3 rule-based fallback.
    """

    global _shot_model, _model_loaded

    if _model_loaded:
        # Reuse the in-memory model after the first successful load.
        return _shot_model

    if not MODEL_PATH.exists():
        # Missing model files are allowed because the API has a fallback predictor.
        print(f"ShotOptix ML model missing: {MODEL_PATH}")
        print("ShotOptix using rule-based fallback because ML model is missing.")
        return None

    try:
        # joblib restores the trained sklearn/XGBoost pipeline from disk.
        _shot_model = joblib.load(MODEL_PATH)
        _model_loaded = True
        print(f"ShotOptix ML model loaded: {MODEL_PATH}")
        return _shot_model
    except Exception as exc:
        # Reset cache flags so a later request can try loading again.
        _shot_model = None
        _model_loaded = False
        print(f"ShotOptix model loading failed: {exc}")
        print("ShotOptix using rule-based fallback because ML model loading failed.")
        return None


def get_model_metadata() -> dict[str, Any] | None:
    """
    Load metadata for the trained ShotOptix model.

    Returns None when metadata is missing or invalid. The prediction flow should
    not fail just because metadata is unavailable.
    """

    global _model_metadata

    if _model_metadata is not None:
        # Reuse parsed metadata once it is available.
        return _model_metadata

    if not METADATA_PATH.exists():
        # Metadata is helpful for diagnostics but not required for predictions.
        print(f"ShotOptix model metadata missing: {METADATA_PATH}")
        return None

    try:
        # Metadata stores feature names, target column, scores, and notes.
        with METADATA_PATH.open("r", encoding="utf-8") as metadata_file:
            _model_metadata = json.load(metadata_file)

        print(f"ShotOptix model metadata loaded successfully: {METADATA_PATH}")
        return _model_metadata
    except Exception as exc:
        _model_metadata = None
        print(f"ShotOptix model metadata loading failed: {exc}")
        return None


def is_model_available() -> bool:
    """
    Return True when the trained ML model can be loaded for prediction.

    Metadata is not required here because prediction only needs the model file.
    If this returns False, the API should continue with rule-based fallback.
    """

    # Reuse load_shot_model so availability and prediction use the same safe path.
    return load_shot_model() is not None


__all__ = [
    "load_shot_model",
    "get_model_metadata",
    "is_model_available",
]
