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


def score_shot_quality(epps: float) -> str:
    if epps >= 1.25:
        return "Excellent"

    if epps >= 1.05:
        return "Good"

    if epps >= 0.85:
        return "Average"

    if epps >= 0.65:
        return "Poor"

    return "Bad"


def get_recommendation(
    shot_zone: str,
    shot_distance: float,
    shot_value: int,
    pressure_level: str,
    epps: float,
    shot_quality: str,
) -> str:
    defender_pressure = normalize_pressure_level(pressure_level)
    zone = shot_zone.lower()

    if defender_pressure == "Very Tight":
        return "Poor spacing. Move away from the defender before shooting."

    if is_mid_range_shot(shot_zone, shot_distance, shot_value) and epps < 0.85:
        return "Low-value mid-range attempt. Look for a paint touch or open three."

    if is_three_point_shot(shot_zone, shot_value) and defender_pressure == "Very Open":
        return "High-value open three. This is a strong shot attempt."

    if is_paint_shot(shot_zone, shot_distance) and defender_pressure in {"Open", "Very Open"}:
        return "Good paint opportunity. Attack the rim."

    if shot_quality == "Excellent":
        return "Excellent shot value. This is a recommended attempt."

    if shot_quality == "Good" and defender_pressure == "Tight":
        return "Good value shot, but create a little more space from the defender."

    if "mid" in zone and shot_quality in {"Poor", "Bad"}:
        return "Low-value mid-range attempt. Look for a paint touch or open three."

    if shot_quality in {"Poor", "Bad"}:
        return "Low expected value. Try to create a cleaner look before shooting."

    return "Solid shot attempt. Stay balanced and read the defender before releasing."
