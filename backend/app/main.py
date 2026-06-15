from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.ml.feature_builder import MODEL_FEATURES
from app.ml.model_loader import get_model_metadata, is_model_available
from app.schemas import (
    ModelInfoResponse,
    ShotPredictionRequest,
    ShotPredictionResponse,
)
from app.services.shot_predictor import predict_shot

# Create the FastAPI app and fill its public API metadata from shared settings.
app = FastAPI(
    title=settings.app_name,
    description="Backend API for the ShotOptix basketball shot optimization engine",
    version=settings.app_version,
)

# Allow the frontend app to call this backend during local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root() -> dict[str, str]:
    # Small root endpoint used to confirm the backend server is running.
    return {
        "message": "ShotOptix Backend is running",
        "status": "ok",
    }


@app.get("/api/health")
def health_check() -> dict[str, str]:
    # Health endpoint for frontend checks, deployment checks, or manual testing.
    return {
        "status": "healthy"
    }


@app.post("/api/predict-shot", response_model=ShotPredictionResponse)
def predict_shot_endpoint(shot: ShotPredictionRequest) -> ShotPredictionResponse:
    # Validate the request through Pydantic, then run the prediction workflow.
    try:
        return predict_shot(shot)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    # Report model metadata without requiring metadata for model prediction to work.
    metadata = get_model_metadata() or {}
    model_loaded = is_model_available()

    return ModelInfoResponse(
        model_loaded=model_loaded,
        model_name=metadata.get("model_name", "shot_xgboost_model"),
        model_type=metadata.get("model_type", "XGBoost XGBClassifier"),
        phase=metadata.get("phase", metadata.get("created_phase", "Phase 4")),
        target_column=metadata.get("target_column", "shot_made"),
        features_used=metadata.get("features_used", MODEL_FEATURES),
        metrics=metadata.get("metrics"),
        training_dataset=metadata.get("training_dataset"),
        prediction_fallback="rule_based_fallback available",
        notes=metadata.get(
            "notes",
            "Rule-based fallback remains available if ML loading or prediction fails.",
        ),
    )
