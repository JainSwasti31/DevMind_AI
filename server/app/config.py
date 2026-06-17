from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    PORT: int = 5000
    # Default points to Atlas; override via .env
    MONGODB_URI: str = "mongodb+srv://user:password@cluster0.mongodb.net/devmindai?retryWrites=true&w=majority"
    JWT_SECRET: str = "change-me"
    JWT_REFRESH_SECRET: str = "change-me-refresh"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GEMINI_API_KEY: str = ""
    GITHUB_TOKEN: str = ""

    class Config:
        # Support running from repo root or from server/ directory
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()
