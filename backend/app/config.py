from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mwana Lari API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Default to SQLite for easy local dev, supports PostgreSQL via env
    DATABASE_URL: str = "sqlite:///./mwana_lari.db"
    
    # JWT Auth
    SECRET_KEY: str = "mwana_lari_super_secret_jwt_key_cg_2026_roots_future"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
