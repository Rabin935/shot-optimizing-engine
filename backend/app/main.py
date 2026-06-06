from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.schemas import ShotPredictionRequest, ShotPredictionResponse
from app.services.shot_predictor import predict_shot

app = FastAPI(
    title=settings.app_name,
    description="Backend API for the ShotOptix basketball shot optimization engine",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    return {
        "message": "ShotOptix Backend is running",
        "status": "ok",
    }


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {
        "status": "healthy"
    }


@app.post("/api/predict-shot", response_model=ShotPredictionResponse)
def predict_shot_endpoint(shot: ShotPredictionRequest) -> ShotPredictionResponse:
    try:
        return predict_shot(shot)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
