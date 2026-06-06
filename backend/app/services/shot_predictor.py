from app.schemas import ShotPredictionRequest, ShotPredictionResponse
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
    Run the Phase 3 rule-based shot prediction workflow.

    This service keeps prediction business logic out of the FastAPI route.
    In Phase 4, the make probability step can be replaced with an ML model.
    """

    make_probability = calculate_make_probability(
        shot_zone=request.shot_zone,
        shot_distance=request.shot_distance,
        defender_distance=request.defender_distance,
        pressure_level=request.pressure_level,
        shot_value=request.shot_value,
    )
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
    )
