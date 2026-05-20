from pydantic import BaseModel, Field


class ShotPredictionRequest(BaseModel):
    shooter_x: float = Field(..., description="Shooter x-position from the sandbox court")
    shooter_y: float = Field(..., description="Shooter y-position from the sandbox court")
    defender_x: float = Field(..., description="Defender x-position from the sandbox court")
    defender_y: float = Field(..., description="Defender y-position from the sandbox court")
    shot_distance: float = Field(..., ge=0, description="Shot distance in feet")
    shot_angle: float = Field(..., description="Shot angle in degrees")
    shot_zone: str = Field(..., min_length=1, description="Shot zone label from the frontend")
    defender_distance: float = Field(..., ge=0, description="Distance to nearest defender in feet")
    pressure_level: str = Field(..., min_length=1, description="Defender pressure label")
    shot_value: int = Field(..., ge=1, le=3, description="Point value of the shot")

    model_config = {
        "json_schema_extra": {
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
            }
        }
    }


class ShotPredictionResponse(BaseModel):
    make_probability: float
    make_probability_percent: str
    shot_value: int
    epps: float
    shot_quality: str
    defender_pressure: str
    recommendation: str
    confidence: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "make_probability": 0.38,
                "make_probability_percent": "38.0%",
                "shot_value": 3,
                "epps": 1.14,
                "shot_quality": "Good",
                "defender_pressure": "Tight",
                "recommendation": "Good value shot, but create a little more space from the defender.",
                "confidence": "Medium",
            }
        }
    }
