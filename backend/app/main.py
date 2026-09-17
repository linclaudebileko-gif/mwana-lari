from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# Determine docs exposure according to environment
is_docs_enabled = settings.ENABLE_PUBLIC_DOCS or (settings.ENVIRONMENT == "development")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API REST officielle pour la plateforme EdTech & Patrimoine Linguistique Mwana Lari",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if is_docs_enabled else None,
    docs_url="/docs" if is_docs_enabled else None,
    redoc_url="/redoc" if is_docs_enabled else None,
    lifespan=lifespan
)

# CORS Configuration with strict explicit whitelist
raw_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
if not raw_origins or ("*" in raw_origins and settings.ENVIRONMENT == "production"):
    allowed_origins_list = ["https://www.cmd.cg", "https://cmd.cg"]
else:
    allowed_origins_list = raw_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,
)

# Global Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

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
        "api_v1": settings.API_V1_STR,
        "environment": settings.ENVIRONMENT
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
