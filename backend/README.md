# ShotOptix Backend

FastAPI backend for the ShotOptix basketball shot optimization engine.

## Phase 4 Overview

Phase 4 integrates a trained XGBoost model into the existing prediction API. The
backend now uses machine learning for make probability when possible, while
keeping the Phase 3 rule-based logic as a fallback.

## What Changed From Phase 3

Phase 3 predicted make probability with simple rules based on shot zone,
distance, defender spacing, pressure level, and shot value.

Phase 4 adds:

- `backend/app/services/ml_shot_predictor.py` for ML-only probability
  prediction.
- `backend/app/ml/model_loader.py` to load the saved model and metadata.
- `backend/app/ml/feature_builder.py` to convert API request data into model
  features.
- `prediction_source` in `POST /api/predict-shot` responses.
- `GET /api/model-info` for model diagnostics.

The existing rule-based service remains available. If the model is missing or
fails, the API still returns a prediction.

## Rule-Based Prediction vs ML Prediction

Rule-based prediction uses fixed basketball logic written by the developer. For
example, open shots receive a positive adjustment and very tight shots receive a
negative adjustment.

ML prediction uses patterns learned from historical shot data. Instead of using
only fixed rules, the XGBoost model compares the current shot features with
patterns from the training dataset and returns a make probability.

## Dataset And Target

The workflow uses cleaned shot log data from:

```text
data/processed/cleaned_shot_logs.csv
```

The target column is:

```text
shot_made
```

`shot_made` is a binary label:

- `1` means the shot was made.
- `0` means the shot was missed.

## Feature Engineering

The model expects numeric columns in a fixed order. `feature_builder.py` creates
these columns from API request data:

- `shot_distance`
- `shot_angle`
- `defender_distance`
- `shot_value`
- `shot_zone_paint`
- `shot_zone_mid_range`
- `shot_zone_three_point`
- `shot_zone_corner_three`
- `pressure_very_tight`
- `pressure_tight`
- `pressure_open`
- `pressure_very_open`

Shot zone and pressure level are converted into one-hot encoded columns so the
model can read them as numbers.

## XGBoost Model

XGBoost is a machine learning algorithm based on many decision trees. Each tree
learns small patterns, and the final model combines those patterns to estimate a
shot make probability.

The backend uses `predict_proba`, not just `predict`, because the app needs a
probability such as `0.42`, not only a made/missed label.

## Model Training And Evaluation

Training was done in the notebook workflow under `notebooks/`. The model was
trained on engineered shot features and evaluated with metrics stored in:

```text
backend/trained_models/model_metadata.json
```

Saved metrics include:

- Accuracy
- Precision
- Recall
- F1 score
- ROC AUC

## Saved Model Location

```text
backend/trained_models/shot_xgboost_model.pkl
backend/trained_models/model_metadata.json
```

## Backend Integration

The request flow is:

1. `POST /api/predict-shot` receives shot context.
2. `shot_predictor.py` asks `ml_shot_predictor.py` for an ML probability.
3. `ml_shot_predictor.py` loads the trained model and builds features.
4. If `predict_proba` succeeds, the response uses `prediction_source:
   "ml_model"`.
5. If ML fails, the Phase 3 rule-based probability is used with
   `prediction_source: "rule_based_fallback"`.
6. EPPS, shot quality, recommendation, and confidence are calculated with the
   existing utility functions.

## API Endpoints

### `GET /`

```json
{
  "message": "ShotOptix Backend is running",
  "status": "ok"
}
```

### `GET /api/health`

```json
{
  "status": "healthy"
}
```

### `POST /api/predict-shot`

Example request:

```json
{
  "shooter_x": 120,
  "shooter_y": 340,
  "defender_x": 160,
  "defender_y": 320,
  "shot_distance": 23.5,
  "shot_angle": 42,
  "shot_zone": "Three Point",
  "defender_distance": 3.2,
  "pressure_level": "Tight",
  "shot_value": 3
}
```

Example response:

```json
{
  "make_probability": 0.38,
  "make_probability_percent": "38.0%",
  "shot_value": 3,
  "epps": 1.14,
  "shot_quality": "Good",
  "recommendation": "Solid shot attempt. Stay balanced and read the defender before releasing.",
  "confidence": "Medium",
  "prediction_source": "ml_model"
}
```

### `GET /api/model-info`

Example response:

```json
{
  "model_loaded": true,
  "model_name": "ShotOptix XGBoost Shot Model",
  "model_type": "XGBoostClassifier",
  "features_used": [
    "shot_distance",
    "shot_angle",
    "defender_distance",
    "shot_value"
  ],
  "target_column": "shot_made",
  "phase": "Phase 4",
  "prediction_fallback": "rule_based"
}
```

## Frontend Display

The Next.js sandbox reads `prediction_source` and shows a small badge in the
stats panel:

- `ML Model` for `ml_model`
- `Rule-Based Fallback` for `rule_based_fallback`

If the backend is offline, the frontend keeps using its local estimate state.

## Run The Server

From the `backend/` folder:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Swagger API docs are available at:

```text
http://localhost:8000/docs
```

## Phase 5 Improvements

Phase 5 can improve model quality and presentation with better feature
selection, more robust validation, probability calibration, player-specific
models, model health checks in the frontend, and clearer shot explanations for
coaches and users.
