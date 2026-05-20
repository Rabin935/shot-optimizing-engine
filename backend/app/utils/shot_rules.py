MIN_PROBABILITY = 0.05
MAX_PROBABILITY = 0.95

PRESSURE_LABELS = {
    "very tight": "Very Tight",
    "tight": "Tight",
    "open": "Open",
    "very open": "Very Open",
}

PRESSURE_ADJUSTMENTS = {
    "Very Tight": -0.10,
    "Tight": -0.05,
    "Open": 0.02,
    "Very Open": 0.06,
}


def clamp_probability(probability: float) -> float:
    return max(MIN_PROBABILITY, min(MAX_PROBABILITY, probability))


def normalize_pressure_level(pressure_level: str) -> str:
    normalized = pressure_level.strip().lower().replace("-", " ")
    return PRESSURE_LABELS.get(normalized, pressure_level.strip().title())


def is_paint_shot(shot_zone: str, shot_distance: float) -> bool:
    zone = shot_zone.lower()
    return shot_distance <= 8 or "paint" in zone or "rim" in zone or "restricted" in zone


def is_mid_range_shot(shot_zone: str, shot_distance: float, shot_value: int) -> bool:
    zone = shot_zone.lower()
    return shot_value == 2 and ("mid" in zone or 8 < shot_distance < 22)


def is_three_point_shot(shot_zone: str, shot_value: int) -> bool:
    zone = shot_zone.lower()
    return shot_value == 3 or "three" in zone or "3pt" in zone or "3-point" in zone


def get_base_probability(shot_zone: str, shot_distance: float, shot_value: int) -> float:
    if is_paint_shot(shot_zone, shot_distance):
        return 0.66

    if is_mid_range_shot(shot_zone, shot_distance, shot_value):
        return 0.43

    if is_three_point_shot(shot_zone, shot_value):
        return 0.36

    return 0.40


def calculate_make_probability(
    shot_zone: str,
    shot_distance: float,
    pressure_level: str,
    shot_value: int,
) -> float:
    probability = get_base_probability(shot_zone, shot_distance, shot_value)
    defender_pressure = normalize_pressure_level(pressure_level)
    probability += PRESSURE_ADJUSTMENTS.get(defender_pressure, 0.0)

    zone = shot_zone.lower()

    if is_paint_shot(shot_zone, shot_distance) and shot_distance <= 4:
        probability += 0.05

    if "corner" in zone and is_three_point_shot(shot_zone, shot_value):
        probability += 0.03

    if shot_distance > 32:
        probability -= 0.12
    elif shot_distance > 28:
        probability -= 0.06

    return round(clamp_probability(probability), 2)
