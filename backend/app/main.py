from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.ml.feature_builder import MODEL_FEATURES
from app.ml.model_loader import get_model_metadata, load_shot_model
from app.schemas import (
    ModelInfoResponse,
    ShotPredictionRequest,
    ShotPredictionResponse,
)
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


@app.get("/api/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    metadata = get_model_metadata() or {}
    model = load_shot_model()

    return ModelInfoResponse(
        model_loaded=model is not None,
        model_name="ShotOptix XGBoost Shot Model",
        model_type="XGBoostClassifier",
        features_used=metadata.get("features_used", MODEL_FEATURES),
        target_column=metadata.get("target_column", "shot_made"),
        phase="Phase 4",
        prediction_fallback="rule_based",
    )
