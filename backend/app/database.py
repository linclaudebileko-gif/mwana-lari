from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import settings

db_url = settings.normalized_database_url

# Configure engine depending on database engine
if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    # PostgreSQL / Cloud Database (Supabase, Neon, Render, Railway, AWS RDS)
    engine = create_engine(
        db_url,
        pool_pre_ping=True,      # Automatically reconnect dropped cloud connections
        pool_size=10,            # Maintain 10 persistent connections
        max_overflow=20,         # Allow up to 20 burst connections
        pool_recycle=300,        # Recycle connections every 5 minutes
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def _ensure_schema(eng):
    from sqlalchemy import text
    try:
        with eng.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1"))
            conn.commit()
    except Exception:
        pass

    for col, col_type in [
        ("applied_at", "TIMESTAMP"),
        ("is_applied", "BOOLEAN DEFAULT FALSE"),
        ("consultation_token", "VARCHAR(64)")
    ]:
        try:
            with eng.connect() as conn:
                conn.execute(text(f"ALTER TABLE payment_transactions ADD COLUMN {col} {col_type}"))
                conn.commit()
        except Exception:
            pass

    try:
        with eng.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS applied_payments (
                    transaction_ref VARCHAR(100) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    subscription_id VARCHAR(36) NOT NULL,
                    amount FLOAT NOT NULL,
                    applied_at TIMESTAMP NOT NULL
                )
            """))
            conn.commit()
    except Exception:
        pass

_ensure_schema(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

