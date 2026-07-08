from app.ml.feature_builder import build_features_from_request
from app.ml.model_loader import load_shot_model
from app.schemas import ShotPredictionRequest


def predict_make_probability_ml(request: ShotPredictionRequest) -> float | None:
    """
    Phase 4 ML prediction layer.

    This service converts API request data into the trained XGBoost feature
    order, then uses predict_proba to return the probability of a made shot.
    If the model is missing or inference fails, return None so the main
    predictor can safely use the Phase 3 rule-based fallback.
    """

    model = load_shot_model()
    if model is None or not hasattr(model, "predict_proba"):
        return None

    try:
        features = build_features_from_request(request)
        probabilities = model.predict_proba(features)
        classes = getattr(model, "classes_", None)

        if classes is not None and 1 in classes:
            made_class_index = list(classes).index(1)
        else:
            made_class_index = 1

        make_probability = float(probabilities[0][made_class_index])
        return max(0.0, min(make_probability, 1.0))
    except Exception as exc:
        print(f"ShotOptix ML prediction failed: {exc}")
        return None
