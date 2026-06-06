def calculate_make_probability(
    shot_zone: str,
    shot_distance: float,
    defender_distance: float,
    pressure_level: str,
    shot_value: int,
) -> float:
    """
    Estimate shot make probability using simple rule-based logic.
    
    This is temporary logic and can be replaced by an ML model later.
    """
    
    normalized_zone = shot_zone.strip().lower()
    normalized_pressure = pressure_level.strip().lower()
    
    if normalized_zone == "paint":
        probability = 0.65
    elif normalized_zone in ("mid-range", "mid-range"):
        probability = 0.42
    elif normalized_zone in ("three point", "three-point", "3pt"):
        probability = 0.35
    else:
        probability = 0.40
    
    
    if normalized_zone == "paint" and shot_distance <= 5:
        probability += 0.05

    if shot_distance >= 28:
        probability -= 0.08
        
    if normalized_pressure == "very tight":
        probability -= 0.18
    elif normalized_pressure == "tight":
        probability -= 0.10
    elif normalized_pressure == "open":
        probability += 0.03
    elif normalized_pressure == "very open":
        probability += 0.07
        
    
    if defender_distance >= 6:
        probability += 0.03
    elif defender_distance <= 2:
        probability -= 0.05

    if shot_value == 3 and shot_distance < 20:
        probability -= 0.04
        
    probability = max(0.05, min(probability, 0.95))
    
    return round(probability, 2)


def get_shot_quality(epps: float) -> str:
    """
    Convert Expected Points Per Shot into a simple quality label.
    """

    # Higher EPPS means the shot is expected to produce more points on average.
    if epps >= 1.25:
        return "Excellent"
    if epps >= 1.05:
        return "Good"
    if epps >= 0.85:
        return "Average"
    if epps >= 0.65:
        return "Poor"

    return "Bad"
