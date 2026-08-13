from app.ml.feature_builder import MODEL_FEATURES, build_features_from_request
from app.ml.model_loader import get_model_metadata, load_ensemble_bundle, load_shot_model
from app.schemas import ShotPredictionRequest


def _bundle_matches_current_schema(base_models: dict) -> bool:
    # Ensemble base models were fit on whatever MODEL_FEATURES looked like at
    # training time. If the feature set has changed since (new columns added
    # or removed), predict_proba would raise a feature-mismatch error -- skip
    # the ensemble cleanly instead of relying on exception-driven fallback.
    for model in base_models.values():
        expected = getattr(model, "feature_names_in_", None)
        if expected is None:
            continue
        return list(expected) == MODEL_FEATURES
    return True


def _positive_probability(model, features) -> float:
    probabilities = model.predict_proba(features)
    classes = getattr(model, "classes_", None)
    if classes is not None and 1 in classes:
        made_class_index = list(classes).index(1)
    else:
        made_class_index = 1
    return float(probabilities[0][made_class_index])


def _predict_with_ensemble(request: ShotPredictionRequest) -> float | None:
    bundle = load_ensemble_bundle()
    if not isinstance(bundle, dict):
        return None

    base_models = bundle.get("base_models") or {}
    meta_model = bundle.get("meta_model")
    model_order = bundle.get("model_order") or list(base_models.keys())
    prior_rates = bundle.get("prior_rates")
    if not base_models or not _bundle_matches_current_schema(base_models):
        return None

    features = build_features_from_request(request, prior_rates=prior_rates)
    probs = []
    for name in model_order:
        model = base_models.get(name)
        if model is None or not hasattr(model, "predict_proba"):
            continue
        probs.append(_positive_probability(model, features))

    if not probs:
        return None

    if meta_model is not None and hasattr(meta_model, "predict_proba"):
        import pandas as pd

        meta_features = pd.DataFrame([probs], columns=model_order[: len(probs)])
        stacked = float(meta_model.predict_proba(meta_features)[0][1])
        return max(0.0, min(stacked, 1.0))

    return max(0.0, min(sum(probs) / len(probs), 1.0))


def predict_make_probability_ml(request: ShotPredictionRequest) -> float | None:
    """
    Phase 4 ML prediction layer.

    Prefer the collaborative stacking ensemble when available, then fall back to
    the single XGBoost model. Return None on failure so rule-based fallback runs.
    """

    try:
        ensemble_probability = _predict_with_ensemble(request)
        if ensemble_probability is not None:
            return ensemble_probability
    except Exception as exc:
        print(f"ShotOptix ensemble prediction failed: {exc}")

    model = load_shot_model()
    if model is None or not hasattr(model, "predict_proba"):
        return None

    try:
        metadata = get_model_metadata() or {}
        prior_rates = metadata.get("prior_rates")
        features = build_features_from_request(request, prior_rates=prior_rates)
        return max(0.0, min(_positive_probability(model, features), 1.0))
    except Exception as exc:
        print(f"ShotOptix ML prediction failed: {exc}")
        return None
