# Shot Optimization Backend

FastAPI service for shot optimization, expected points prediction, and future
model-serving endpoints.

## Setup

```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```powershell
.\venv\Scripts\uvicorn app.main:app --reload
```

The API starts at `http://127.0.0.1:8000`.
