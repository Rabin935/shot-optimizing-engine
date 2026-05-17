# Shot Optimization Engine

Basketball shot optimization project with a Next.js app and FastAPI backend for
Expected Points Per Shot (EPPS) modeling.

## Project Structure

```text
shot-optimization-engine/
|-- frontend/
|   |-- app/
|   |-- public/
|   |-- package.json
|   |-- next.config.ts
|   |-- postcss.config.mjs
|   `-- tsconfig.json
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |-- routers/
|   |   |-- models/
|   |   |-- schemas/
|   |   `-- core/
|   |-- data/
|   |-- models/
|   |-- requirements.txt
|   `-- README.md
|-- data/
|-- docs/
|-- notebooks/
`-- README.md
```

## Frontend

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Backend

```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/health`.
