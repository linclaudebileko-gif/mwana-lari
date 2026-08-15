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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

