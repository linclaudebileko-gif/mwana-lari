from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import settings
from .routers import (
    auth_router,
    parents_router,
    words_router,
    lessons_router,
    heritage_router,
    validations_router,
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev & mobile PWA
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
