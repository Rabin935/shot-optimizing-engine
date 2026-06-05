import os
from dataclasses import dataclass
from dotenv import load_dotenv

from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    app_name: str = "ShotOptix API"
    app_version: str = "0.1.0"
    debug: bool = True

settings = Settings()