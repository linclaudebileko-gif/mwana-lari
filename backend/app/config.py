from pydantic_settings import BaseSettings
from typing import Optional, List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mwana Lari API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database: Default to SQLite for local dev, supports PostgreSQL / Supabase / Neon / Railway in production
    DATABASE_URL: str = "sqlite:///./mwana_lari.db"
    
    # JWT Auth
    SECRET_KEY: str = "mwana_lari_super_secret_jwt_key_cg_2026_roots_future"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Environment & CORS
    ENVIRONMENT: str = "production"
    ALLOWED_ORIGINS: str = "*" # Comma-separated list or "*" for all

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        # Cloud providers like Render / Heroku / Supabase might provide postgres://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

