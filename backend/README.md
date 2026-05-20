# ShotOptix Backend

Phase 3 adds a FastAPI backend for basic shot prediction. The current predictor is intentionally rule-based: it estimates make probability from shot zone, distance, shot value, and defender pressure, then calculates Expected Points Per Shot (EPPS).

Phase 4 can replace the rule-based predictor with a trained ML model such as XGBoost while keeping the same API contract.

## Setup

From the `backend/` folder:

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```powershell
uvicorn app.main:app --reload
```

The API starts at `http://localhost:8000`.

## Endpoints

### GET /

Health check endpoint.

Example response:

```json
{
  "message": "ShotOptix Backend is running",
  "status": "ok"
}
```

### POST /api/predict-shot

Returns rule-based make probability, shot value, EPPS, shot quality, defender pressure, recommendation, and confidence.

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
  "make_probability": 0.31,
  "make_probability_percent": "31.0%",
  "shot_value": 3,
  "epps": 0.93,
  "shot_quality": "Average",
  "defender_pressure": "Tight",
  "recommendation": "Solid shot attempt. Stay balanced and read the defender before releasing.",
  "confidence": "Medium"
}
```

## Frontend Origin

CORS allows the Next.js frontend at:

```text
http://localhost:3000
```

You can override this locally with:

```text
FRONTEND_ORIGIN=http://localhost:3000
```
