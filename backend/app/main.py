from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ShotOptix API", version="1.0")

# This allows your Next.js frontend to connect to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "🏀 ShotOptix Backend is Running Successfully!",
        "status": "active"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ShotOptix API"}