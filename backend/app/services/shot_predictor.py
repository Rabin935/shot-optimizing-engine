from app.schemas import ShotPredictionRequest, ShotPredictionResponse
from app.services.ml_shot_predictor import predict_make_probability_ml
from app.utils.epps import calculate_epps
from app.utils.shot_rules import (
    calculate_make_probability,
    generate_recommendation,
    get_confidence_level,
    get_shot_quality,
)


def _format_probability_percent(make_probability: float) -> str:
    """Convert a decimal probability like 0.25 into a display string like 25.0%."""

    return f"{make_probability * 100:.1f}%"


def predict_shot(request: ShotPredictionRequest) -> ShotPredictionResponse:
    """
    Run the shot prediction workflow.

    Phase 4 tries the trained ML model first for make probability. If the model
    is unavailable or inference fails, the original Phase 3 rule-based logic is
    used as a stable fallback.
    """

    ml_probability = predict_make_probability_ml(request)
    if ml_probability is None:
        make_probability = calculate_make_probability(
            shot_zone=request.shot_zone,
            shot_distance=request.shot_distance,
            defender_distance=request.defender_distance,
            pressure_level=request.pressure_level,
            shot_value=request.shot_value,
        )
        prediction_source = "rule_based_fallback"
    else:
        make_probability = ml_probability
        prediction_source = "ml_model"

    make_probability_percent = _format_probability_percent(make_probability)
    epps = calculate_epps(make_probability, request.shot_value)
    shot_quality = get_shot_quality(epps)
    recommendation = generate_recommendation(
        shot_zone=request.shot_zone,
        pressure_level=request.pressure_level,
        epps=epps,
        shot_quality=shot_quality,
        defender_distance=request.defender_distance,
    )
    confidence = get_confidence_level(
        shot_distance=request.shot_distance,
        pressure_level=request.pressure_level,
    )

    return ShotPredictionResponse(
        make_probability=make_probability,
        make_probability_percent=make_probability_percent,
        shot_value=request.shot_value,
        epps=epps,
        shot_quality=shot_quality,
        recommendation=recommendation,
        confidence=confidence,
        prediction_source=prediction_source,
    )
