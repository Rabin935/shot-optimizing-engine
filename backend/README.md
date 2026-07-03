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

The cleaner now combines the original `data/raw/shot_logs.csv` file with the
added NBA shot-location season files in
`data/raw/NBA shot dataset (2000 - 2024)/`.

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
- `loc_x`
- `loc_y`
- `abs_loc_x`
- `game_clock_seconds`
- shot action flags such as `is_dunk`, `is_layup`, `is_pullup`, and
  `is_driving`
- position flags such as `position_guard`, `position_forward`, and
  `position_center`
- `shot_value`
- `period`
- `shot_clock`
- `dribbles`
- `touch_time`
- derived context features such as `late_clock`, `quick_touch`, `long_three`,
  and `distance_pressure_interaction`
- `zone_paint`
- `zone_mid_range`
- `zone_three_point`
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

Training can be regenerated with:

```powershell
.\backend\venv\Scripts\python.exe scripts\train_and_save_shotoptix_model.py
```

The model is trained on `data/processed/shotoptix_ml_training.csv` with
`shot_made` as the target. Metrics and feature importance are stored in:

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

Metadata is loaded from `model_metadata.json` for diagnostics. If metadata is
missing, model prediction can still work. If the model file is missing or cannot
be loaded, the backend prints a fallback message and continues with the
rule-based predictor.

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
  "shot_value": 3,
  "period": 4,
  "shot_clock": 12,
  "dribbles": 1,
  "touch_time": 2.5
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
  "model_name": "shot_xgboost_model",
  "model_type": "XGBoost XGBClassifier",
  "phase": "Step 6 - Save Trained ShotOptix XGBoost Model",
  "target_column": "shot_made",
  "features_used": [
    "period",
    "shot_clock",
    "dribbles",
    "touch_time",
    "shot_distance",
    "loc_x",
    "loc_y",
    "is_dunk",
    "is_pullup"
  ],
  "metrics": {
    "accuracy": 0.6295,
    "roc_auc": 0.6539
  },
  "training_dataset": "data/processed/shotoptix_ml_training.csv",
  "prediction_fallback": "rule_based_fallback available",
  "notes": "Feature order must match app.ml.feature_builder.MODEL_FEATURES."
}
```

## Frontend Display

The Next.js sandbox has draggable shooter and defenders, presets, shot line,
pressure radius, analytics overlay, local fallback stats, and a backend
prediction panel. Court visuals and some small pills still use local
`calculateSandboxStats` for instant feedback. The right stats panel reads
backend output when available.

The stats panel reads `prediction_source` and shows a small badge:

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
