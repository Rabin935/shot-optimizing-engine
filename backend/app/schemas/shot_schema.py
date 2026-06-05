from pydantic import BaseModel, ConfigDict, Field

class ShotPredictionRequest(BaseModel):
    shooter_x: float
    shooter_y: float
    defender_x: float
    defender_y: float
    shot_distance: float = Field(..., ge=0)
    shot_angle: float = Field(..., ge=0, le=180)
    shot_zone: str
    defender_distance: float = Field(..., ge=0)
    pressure_level: str
    shot_vlue: int = Field(..., ge=2, le=3)
    
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
            }
        }
    )
    
class ShotPredictionResponse(BaseModel):
    make_probability: float = Field(..., ge=0, le=1)
    make_probability_percent: str
    shot_value: int = Field(..., ge=2, le=3)
    epps: float = Field(..., ge=0)
    shot_quality: str
    recommendation: str
    confidence: str
    
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
                }
        }
    )