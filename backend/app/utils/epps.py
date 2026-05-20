def calculate_epps(make_probability: float, shot_value: int) -> float:
    """Calculate Expected Points Per Shot."""
    return round(make_probability * shot_value, 2)
