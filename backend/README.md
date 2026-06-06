# ShotOptix Backend

FastAPI backend for the ShotOptix basketball shot optimization engine.

## Phase 3 Overview

Phase 3 provides a working rule-based backend API. It accepts shot context from the frontend, estimates make probability, calculates Expected Points Per Shot, labels shot quality, and returns a short coaching recommendation.

This phase is not machine learning yet. The goal is to create a clean API contract and backend workflow before replacing the rule logic with an ML model in Phase 4.

## What The Backend Does

- Runs a FastAPI server.
- Allows requests from the Next.js frontend at `http://localhost:3000`.
- Validates shot input using Pydantic schemas.
- Calculates make probability using simple basketball rules.
- Calculates EPPS using the formula `make_probability * shot_value`.
- Returns shot quality, recommendation, and confidence.

## Folder Structure

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   └── config.py
│   ├── schemas/
│   │   └── shot_schema.py
│   ├── services/
│   │   └── shot_predictor.py
│   └── utils/
│       ├── epps.py
│       └── shot_rules.py
├── requirements.txt
└── README.md
```

## Installation

From the `backend/` folder:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Run The Server

From the `backend/` folder:

```powershell
uvicorn app.main:app --reload
```

If `uvicorn` is not recognized, run it through the virtual environment:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

Swagger API docs are available at:

```text
http://localhost:8000/docs
```

## Health Check Endpoint

### `GET /`

Example response:

```json
{
  "message": "ShotOptix Backend is running",
  "status": "ok"
}
```

## Predict Shot Endpoint

### `POST /api/predict-shot`

This endpoint accepts shot information and returns a rule-based prediction.

Example request body:

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

Example response body:

```json
{
  "make_probability": 0.25,
  "make_probability_percent": "25.0%",
  "shot_value": 3,
  "epps": 0.75,
  "shot_quality": "Poor",
  "recommendation": "Create more space before taking this shot.",
  "confidence": "Medium"
}
```

Invalid request data returns FastAPI/Pydantic validation errors. For example, `shot_value` must be `2` or `3`.

## EPPS Formula

EPPS means Expected Points Per Shot.

```text
EPPS = P(make) * Shot Value
```

Example:

```text
0.38 * 3 = 1.14 EPPS
```

This means the shot is expected to produce `1.14` points on average.

## Rule-Based Prediction

Phase 3 uses simple rules instead of ML:

- Paint shots start with a higher make probability.
- Mid-range shots start with a medium make probability.
- Three-point shots start with a lower make probability.
- Tight defender pressure lowers probability.
- Open spacing improves probability.
- Very long shots receive a penalty.

The backend then converts EPPS into labels such as `Excellent`, `Good`, `Average`, `Poor`, or `Bad`.

## Phase 4 Plan

In Phase 4, the rule-based probability logic can be replaced with a trained ML model such as XGBoost. The API request and response format can stay the same, which means the frontend should not need major changes.

## Frontend Integration Notes

- The frontend should send requests to `http://localhost:8000/api/predict-shot`.
- The frontend development server is allowed through CORS at `http://localhost:3000`.
- Keep request field names in `snake_case` to match the Python backend schemas.
- Use `/docs` to test the endpoint before connecting the frontend.
