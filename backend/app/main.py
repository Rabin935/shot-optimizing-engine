from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.schemas import ShotPredictionRequest, ShotPredictionResponse
from app.services.shot_predictor import predict_shot

app = FastAPI(
    title="ShotOptix Backend API",
    description="Backend API for the ShotOptix basketball shot optimization engine",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "ShotOptix backend is running",
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy"    
        }


@app.post("/api/predict-shot", response_model=ShotPredictionResponse)
def predict_shot_endpoint(shot: ShotPredictionRequest) -> ShotPredictionResponse:
    return predict_shot(shot)
