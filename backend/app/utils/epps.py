def calculate_epps(make_probability: float, shot_value: int) -> float:
    """
    Calculate Expected Points Per Shot.
    
    EPPS = probability of making the shot * point value of the shot
    
    """
    
    safe_probability = max(0.0, min(make_probability, 1.0))
    
    if shot_value not in (2, 3):
        raise ValueError("shot_value must be 2 or 3")
    
    epps = safe_probability * shot_value
    
    return round(epps, 2)
