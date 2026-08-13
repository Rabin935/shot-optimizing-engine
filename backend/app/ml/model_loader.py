import json
from pathlib import Path
from typing import Any

import joblib


BACKEND_DIR = Path(__file__).resolve().parents[2]
TRAINED_MODELS_DIR = BACKEND_DIR / "trained_models"
MODEL_PATH = TRAINED_MODELS_DIR / "shot_xgboost_model.pkl"
METADATA_PATH = TRAINED_MODELS_DIR / "model_metadata.json"
ENSEMBLE_PATH = TRAINED_MODELS_DIR / "shot_stacking_ensemble.joblib"
ENSEMBLE_METADATA_PATH = TRAINED_MODELS_DIR / "ensemble_metadata.json"

_shot_model: Any | None = None
_model_loaded = False
_model_metadata: dict[str, Any] | None = None
_ensemble_bundle: Any | None = None
_ensemble_loaded = False


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


def load_ensemble_bundle() -> Any | None:
    """Load the collaborative stacking ensemble when available."""

    global _ensemble_bundle, _ensemble_loaded

    if _ensemble_loaded:
        return _ensemble_bundle

    if not ENSEMBLE_PATH.exists():
        _ensemble_loaded = True
        _ensemble_bundle = None
        return None

    try:
        _ensemble_bundle = joblib.load(ENSEMBLE_PATH)
        _ensemble_loaded = True
        print(f"ShotOptix ensemble loaded successfully: {ENSEMBLE_PATH}")
        return _ensemble_bundle
    except Exception as exc:
        _ensemble_bundle = None
        _ensemble_loaded = True
        print(f"ShotOptix ensemble loading failed: {exc}")
        return None


def get_model_metadata() -> dict[str, Any] | None:
    """
    Load metadata for the trained ShotOptix model.

    Prefer ensemble metadata when the ensemble artifact exists and reports a
    higher accuracy than the single XGBoost model.
    """

    global _model_metadata

    if _model_metadata is not None:
        return _model_metadata

    xgb_meta = None
    if METADATA_PATH.exists():
        try:
            with METADATA_PATH.open("r", encoding="utf-8") as metadata_file:
                xgb_meta = json.load(metadata_file)
        except Exception as exc:
            print(f"ShotOptix model metadata loading failed: {exc}")

    ensemble_meta = None
    if ENSEMBLE_METADATA_PATH.exists():
        try:
            with ENSEMBLE_METADATA_PATH.open("r", encoding="utf-8") as metadata_file:
                ensemble_meta = json.load(metadata_file)
        except Exception as exc:
            print(f"ShotOptix ensemble metadata loading failed: {exc}")

    def _accuracy(meta: dict[str, Any] | None) -> float:
        if not meta:
            return 0.0
        tuned = meta.get("metrics_at_decision_threshold") or meta.get("metrics") or {}
        return float(tuned.get("accuracy", 0.0))

    if ensemble_meta and _accuracy(ensemble_meta) >= _accuracy(xgb_meta):
        _model_metadata = ensemble_meta
        print(f"ShotOptix ensemble metadata loaded successfully: {ENSEMBLE_METADATA_PATH}")
    elif xgb_meta is not None:
        _model_metadata = xgb_meta
        print(f"ShotOptix model metadata loaded successfully: {METADATA_PATH}")
    else:
        print(f"ShotOptix model metadata missing: {METADATA_PATH}")
        return None

    return _model_metadata


__all__ = [
    "load_shot_model",
    "load_ensemble_bundle",
    "get_model_metadata",
]
