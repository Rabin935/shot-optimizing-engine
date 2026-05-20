from app.schemas import ShotPredictionRequest, ShotPredictionResponse
from app.utils.epps import calculate_epps
from app.utils.shot_rules import (
    calculate_make_probability,
    get_recommendation,
    normalize_pressure_level,
    score_shot_quality,
)


def format_probability_percent(make_probability: float) -> str:
    return f"{make_probability * 100:.1f}%"


def get_confidence_level(shot_quality: str, defender_pressure: str) -> str:
    if shot_quality == "Excellent" and defender_pressure in {"Open", "Very Open"}:
        return "High"

    if shot_quality in {"Poor", "Bad"} or defender_pressure == "Very Tight":
        return "Low"

    return "Medium"


def predict_shot(shot: ShotPredictionRequest) -> ShotPredictionResponse:
    defender_pressure = normalize_pressure_level(shot.pressure_level)
    make_probability = calculate_make_probability(
        shot_zone=shot.shot_zone,
        shot_distance=shot.shot_distance,
        pressure_level=defender_pressure,
        shot_value=shot.shot_value,
    )
    epps = calculate_epps(make_probability, shot.shot_value)
    shot_quality = score_shot_quality(epps)
    recommendation = get_recommendation(
        shot_zone=shot.shot_zone,
        shot_distance=shot.shot_distance,
        shot_value=shot.shot_value,
        pressure_level=defender_pressure,
        epps=epps,
        shot_quality=shot_quality,
    )

    return ShotPredictionResponse(
        make_probability=make_probability,
        make_probability_percent=format_probability_percent(make_probability),
        shot_value=shot.shot_value,
        epps=epps,
        shot_quality=shot_quality,
        defender_pressure=defender_pressure,
        recommendation=recommendation,
        confidence=get_confidence_level(shot_quality, defender_pressure),
    )
