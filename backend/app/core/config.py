import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env values before Settings reads environment variables.
load_dotenv()


class Settings(BaseModel):
    # Centralized backend settings used by FastAPI and CORS configuration.
    app_name: str = "ShotOptix API"
    app_version: str = "0.1.0"
    debug: bool = True
    allowed_origins: list[str] = [
        os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    ]

# A single settings object is imported anywhere configuration is needed.
settings = Settings()
