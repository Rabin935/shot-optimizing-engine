from pydantic import BaseModel, ConfigDict, Field


class ShotPredictionRequest(BaseModel):
    # Request fields describe one shot attempt coming from the frontend court.
    shooter_x: float
    shooter_y: float
    defender_x: float
    defender_y: float
    shot_distance: float = Field(..., ge=0)
    shot_angle: float = Field(..., ge=0, le=180)
    shot_zone: str
    defender_distance: float = Field(..., ge=0)
    pressure_level: str
    shot_value: int = Field(..., ge=2, le=3)
    period: int = Field(default=4, ge=1, le=10)
    shot_clock: float = Field(default=12.0, ge=0, le=24)
    dribbles: float = Field(default=1.0, ge=0)
    touch_time: float = Field(default=2.5, ge=0)
    loc_x: float = 0.0
    loc_y: float = 0.0
    game_clock_seconds: float = Field(default=12.0, ge=0)
    is_home: int = Field(default=0, ge=0, le=1)
    action_type: str = ""
    shot_type: str = ""
    position_group: str = ""

    # Example payload appears in the generated FastAPI docs.
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "shooter_x": 120,
                "shooter_y": 340,
                "defender_x": 160,
                "defender_y": 320,
                "shot_distance": 23.5,
                "shot_angle": 42,
                "shot_zone": "Three Point",
                "defender_distance": 3.2,
                "pressure_level": "Tight",
                "shot_value": 3,
                "period": 4,
                "shot_clock": 12.0,
                "dribbles": 1,
                "touch_time": 2.5,
                "loc_x": 1.5,
                "loc_y": 30.5,
                "game_clock_seconds": 626,
                "is_home": 0,
                "action_type": "Pullup Jump shot",
                "shot_type": "3PT Field Goal",
                "position_group": "G",
            }
        }
    )


class ShotPredictionResponse(BaseModel):
    # Response fields combine probability, EPPS, labels, and coaching feedback.
    make_probability: float = Field(..., ge=0, le=1)
    make_probability_percent: str
    shot_value: int = Field(..., ge=2, le=3)
    epps: float = Field(..., ge=0)
    shot_quality: str
    recommendation: str
    confidence: str
    prediction_source: str
    
    # Example response appears in the generated FastAPI docs.
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "make_probability": 0.38,
                "make_probability_percent": "38.0%",
                "shot_value": 3,
                "epps": 1.14,
                "shot_quality": "Good",
                "recommendation": "Good value shot, but create more space.",
                "confidence": "Medium",
                "prediction_source": "ml_model",
            }
        }
    )


class ModelInfoResponse(BaseModel):
    # Model diagnostics let the frontend explain whether ML or fallback is active.
    model_loaded: bool
    model_name: str
    model_type: str
    phase: str
    target_column: str
    features_used: list[str]
    metrics: dict[str, float] | None = None
    training_dataset: str | None = None
    prediction_fallback: str
    notes: str | None = None
