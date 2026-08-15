from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import datetime
from .config import settings
from .routers import (
    auth_router,
    parents_router,
    words_router,
    lessons_router,
    heritage_router,
    validations_router,
    payments_router,
)
from .seed.seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database and default records on startup
    print("[API] Initialisation de Mwana Lari API...")
    seed_database()
    yield
    print("[API] Arret de Mwana Lari API.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API REST officielle pour la plateforme EdTech & Patrimoine Linguistique Mwana Lari",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
allowed_origins_list = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
if not allowed_origins_list or "*" in allowed_origins_list:
    allowed_origins_list = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(parents_router, prefix=settings.API_V1_STR)
app.include_router(words_router, prefix=settings.API_V1_STR)
app.include_router(lessons_router, prefix=settings.API_V1_STR)
app.include_router(heritage_router, prefix=settings.API_V1_STR)
app.include_router(validations_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "motto": "Apprendre sa langue. Comprendre ses racines. Préparer son avenir.",
        "status": "healthy",
        "documentation": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

