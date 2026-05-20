from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.schemas import ShotPredictionRequest, ShotPredictionResponse
from app.services.shot_predictor import predict_shot

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict[str, str]:
    return {
        "message": "ShotOptix Backend is running",
        "status": "ok",
    }


@app.post("/api/predict-shot", response_model=ShotPredictionResponse)
def predict_shot_endpoint(shot: ShotPredictionRequest) -> ShotPredictionResponse:
    return predict_shot(shot)
