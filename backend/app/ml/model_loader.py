import json
from pathlib import Path
from typing import Any

import joblib


BACKEND_DIR = Path(__file__).resolve().parents[2]
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"
MODEL_PATH = TRAINED_MODELS_DIR / "shot_xgboost_model.pkl"
METADATA_PATH = TRAINED_MODELS_DIR / "model_metadata.json"

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
        return _shot_model

    if not MODEL_PATH.exists():
        print(f"ShotOptix model missing: {MODEL_PATH}")
        return None

    try:
        _shot_model = joblib.load(MODEL_PATH)
        _model_loaded = True
        print(f"ShotOptix model loaded successfully: {MODEL_PATH}")
        return _shot_model
    except Exception as exc:
        _shot_model = None
        _model_loaded = False
        print(f"ShotOptix model loading failed: {exc}")
        return None


def get_model_metadata() -> dict[str, Any] | None:
    """
    Load metadata for the trained ShotOptix model.

    Returns None when metadata is missing or invalid. The prediction flow should
    not fail just because metadata is unavailable.
    """

    global _model_metadata

    if _model_metadata is not None:
        return _model_metadata

    if not METADATA_PATH.exists():
        print(f"ShotOptix model metadata missing: {METADATA_PATH}")
        return None

    try:
        with METADATA_PATH.open("r", encoding="utf-8") as metadata_file:
            _model_metadata = json.load(metadata_file)

        print(f"ShotOptix model metadata loaded successfully: {METADATA_PATH}")
        return _model_metadata
    except Exception as exc:
        _model_metadata = None
        print(f"ShotOptix model metadata loading failed: {exc}")
        return None


__all__ = [
    "load_shot_model",
    "get_model_metadata",
]
