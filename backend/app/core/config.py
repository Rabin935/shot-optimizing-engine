import os
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    app_name: str = "ShotOptix API"
    app_version: str = "0.1.0"
    debug: bool = True
    allowed_origins: list[str] = [
        os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    ]

settings = Settings()
