# ShotOptix Shot Optimization Engine

ShotOptix is a basketball shot optimization project with a Next.js sandbox and a
FastAPI backend. It estimates make probability, Expected Points Per Shot (EPPS),
shot quality, and coaching recommendations from shot context.

## Phase 4 Overview

Phase 4 adds a trained XGBoost machine learning model to the prediction flow.
The backend now tries the ML model first, then falls back to the Phase 3
rule-based predictor if the model file is missing or inference fails.

What changed from Phase 3:

- Phase 3 used hand-written basketball rules for make probability.
- Phase 4 uses `backend/trained_models/shot_xgboost_model.pkl` for make
  probability when available.
- EPPS, shot quality, recommendation, and confidence still use the existing
  backend utilities.
- API responses include `prediction_source` so the frontend can show whether the
  result came from the ML model or the rule fallback.
- `GET /api/model-info` reports whether the model is loaded and which features
  it expects.

## Project Structure

```text
shot-optimization-engine/
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- ml/
|   |   |   |-- feature_builder.py
|   |   |   `-- model_loader.py
|   |   |-- schemas/
|   |   |-- services/
|   |   |   |-- ml_shot_predictor.py
|   |   |   `-- shot_predictor.py
|   |   `-- utils/
|   |-- trained_models/
|   |   |-- model_metadata.json
|   |   `-- shot_xgboost_model.pkl
|   `-- requirements.txt
|-- data/
|   |-- raw/
|   `-- processed/
|-- docs/
|   `-- phase-4-ml-notes.md
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   `-- lib/
|-- notebooks/
`-- scripts/
```

## Dataset And Features

The model workflow uses cleaned shot log data from
`data/processed/cleaned_shot_logs.csv`, produced from the raw shot data in
`data/raw/shot_logs.csv`. The target column is `shot_made`, which means the
model learns whether a shot was made (`1`) or missed (`0`).

Feature engineering converts the API shot context into numeric model inputs:

- Distance, angle, defender distance, and shot value stay numeric.
- Shot zone becomes one-hot columns such as `shot_zone_paint` and
  `shot_zone_three_point`.
- Pressure level becomes one-hot columns such as `pressure_tight` and
  `pressure_open`.

The backend builds these features in `backend/app/ml/feature_builder.py`.

## XGBoost Model

XGBoost is a tree-based machine learning model. In simple terms, it builds many
small decision trees and combines them to estimate the chance that a shot is
made. The backend uses `predict_proba`, so it receives a probability between
`0` and `1` instead of only a made/missed class.

The saved model and metadata live in:

```text
backend/trained_models/shot_xgboost_model.pkl
backend/trained_models/model_metadata.json
```

Evaluation metrics saved in metadata include accuracy, precision, recall,
F1 score, and ROC AUC.

## API Endpoints

### `POST /api/predict-shot`

Predicts make probability, EPPS, shot quality, recommendation, confidence, and
prediction source.

`prediction_source` can be:

- `ml_model`
- `rule_based_fallback`

### `GET /api/model-info`

Returns model diagnostics for demos and debugging:

```json
{
  "model_loaded": true,
  "model_name": "ShotOptix XGBoost Shot Model",
  "model_type": "XGBoostClassifier",
  "features_used": ["shot_distance"],
  "target_column": "shot_made",
  "phase": "Phase 4",
  "prediction_fallback": "rule_based"
}
```

## Frontend

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000`.

The sandbox sends shot context to the FastAPI backend. The stats panel shows a
small badge such as `ML Model` or `Rule-Based Fallback` when the backend returns
`prediction_source`.

## Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open Swagger docs at `http://localhost:8000/docs`.

## Phase 5 Ideas

Phase 5 can improve the model with richer player tracking features, stronger
validation, better calibration, shot chart explanations, and frontend model
health indicators.
