def calculate_epps(make_probability: float, shot_value: int) -> float:
    """
    Calculate Expected Points Per Shot.
    
    EPPS = probability of making the shot * point value of the shot
    
    """
    
    # Clamp probability so EPPS never uses an invalid value.
    safe_probability = max(0.0, min(make_probability, 1.0))
    
    if shot_value not in (2, 3):
        # Basketball shots in this app are only modeled as 2-point or 3-point attempts.
        raise ValueError("shot_value must be 2 or 3")
    
    # Expected points equals chance of making the shot times the point value.
    epps = safe_probability * shot_value
    
    return round(epps, 2)
