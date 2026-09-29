from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import secrets

DEFAULT_DEV_SECRET = "mwana_lari_super_secret_jwt_key_cg_2026_roots_future"
DEFAULT_DEV_WEBHOOK_SECRET = "mwana_lari_momo_secret_key_2026"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Mwana Lari API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode: 'development', 'staging', 'production'
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    
    # Security flags
    ALLOW_DEMO_LOGIN: bool = os.getenv("ALLOW_DEMO_LOGIN", "false").lower() in ("true", "1")
    ENABLE_PUBLIC_DOCS: bool = os.getenv("ENABLE_PUBLIC_DOCS", "false").lower() in ("true", "1")
    
    # Database: Default to SQLite for local dev, supports PostgreSQL / Supabase / Neon / Railway in production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mwana_lari.db")
    
    # JWT & Session Auth Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", DEFAULT_DEV_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # Password Policy & HIBP k-Anonymity Configuration
    MIN_PASSWORD_LENGTH: int = int(os.getenv("MIN_PASSWORD_LENGTH", "12"))
    MAX_PASSWORD_LENGTH: int = int(os.getenv("MAX_PASSWORD_LENGTH", "256"))
    CHECK_PWNED_PASSWORDS: bool = os.getenv("CHECK_PWNED_PASSWORDS", "true").lower() in ("true", "1")
    PWNED_PASSWORDS_FAIL_OPEN: bool = os.getenv("PWNED_PASSWORDS_FAIL_OPEN", "true").lower() in ("true", "1")
    PWNED_PASSWORDS_TIMEOUT: float = float(os.getenv("PWNED_PASSWORDS_TIMEOUT", "5.0"))
    
    # Cookie & CSRF Security Flags
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "true" if os.getenv("ENVIRONMENT", "production") == "production" else "false").lower() in ("true", "1")
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    
    # Webhook Secret for Mobile Money callbacks
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", DEFAULT_DEV_WEBHOOK_SECRET)
    
    # CinetPay Payment Gateway Config (Mobile Money & Carte Bancaire)
    CINETPAY_API_KEY: str = os.getenv("CINETPAY_API_KEY", "")
    CINETPAY_SITE_ID: str = os.getenv("CINETPAY_SITE_ID", "")
    CINETPAY_SECRET_KEY: str = os.getenv("CINETPAY_SECRET_KEY", "")
    CINETPAY_SANDBOX: bool = os.getenv("CINETPAY_SANDBOX", "true").lower() in ("true", "1")

    # OpenPay Congo Payment Gateway Config (MTN MoMo & Airtel Money)
    OPENPAY_API_KEY: str = os.getenv("OPENPAY_API_KEY", "")
    OPENPAY_BASE_URL: str = os.getenv("OPENPAY_BASE_URL", "https://api.openpay-cg.com/v1")
    
    # CORS Origins (Explicit whitelist)
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS", 
        "https://www.cmd.cg,https://cmd.cg,http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173"
    )

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        # Cloud providers like Render / Heroku / Supabase might provide postgres://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    def validate_production_security(self):
        """
        Ensures production deployments do not run with default placeholder secrets.
        """
        if self.ENVIRONMENT == "production":
            if not self.SECRET_KEY or self.SECRET_KEY == DEFAULT_DEV_SECRET:
                # Generate an ephemeral strong key to prevent static dictionary attacks if not set
                print("[SECURITY WARNING] SECRET_KEY non configurée en production. Génération automatique d'une clé aléatoire.")
                self.SECRET_KEY = secrets.token_urlsafe(48)
            if not self.WEBHOOK_SECRET or self.WEBHOOK_SECRET == DEFAULT_DEV_WEBHOOK_SECRET:
                print("[SECURITY WARNING] WEBHOOK_SECRET non configurée en production. Génération d'une clé aléatoire.")
                self.WEBHOOK_SECRET = secrets.token_urlsafe(32)

    class Config:
        case_sensitive = True
        extra = "ignore"
        env_file = (".env", "../.env")

settings = Settings()
settings.validate_production_security()

