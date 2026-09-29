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

# CORS Configuration with strict explicit whitelist (no wildcard when allow_credentials=True)
raw_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
if not raw_origins or ("*" in raw_origins and settings.ENVIRONMENT == "production"):
    allowed_origins_list = ["https://www.cmd.cg", "https://cmd.cg"]
else:
    allowed_origins_list = [o for o in raw_origins if o != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-Token", "Accept"],
    expose_headers=["X-CSRF-Token"],
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

# Global Anti-CSRF Middleware for Cookie-Authenticated Requests
@app.middleware("http")
async def enforce_csrf_protection(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH", "DELETE"):
        path = request.url.path
        # Endpoints that initiate/refresh auth, log out, or receive signed server webhooks are exempt
        is_exempt = any(path.endswith(endpoint) for endpoint in [
            "/auth/login",
            "/auth/register",
            "/auth/demo-login",
            "/auth/csrf",
            "/auth/refresh",
            "/auth/logout",
            "/payments/cinetpay/notify",
            "/payments/cinetpay/webhook",
            "/payments/openpay/webhook",
            "/payments/webhook/openpay",
            "/payments/webhook",
        ])
        if not is_exempt:
            has_auth_cookie = bool(
                request.cookies.get("mwana_access_token") or 
                request.cookies.get("access_token")
            )
            has_bearer_header = bool(
                request.headers.get("Authorization") and 
                request.headers.get("Authorization").startswith("Bearer ")
            )
            # If request is authenticated via browser cookie and lacks Bearer token, validate CSRF
            if has_auth_cookie and not has_bearer_header:
                header_csrf = request.headers.get("X-CSRF-Token")
                cookie_csrf = request.cookies.get("mwana_csrf_token")
                from .auth.security import validate_csrf_token
                if not validate_csrf_token(header_csrf, cookie_csrf):
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Protection CSRF: Jeton CSRF manquant ou invalide. Veuillez recharger la page."}
                    )
    return await call_next(request)

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(parents_router, prefix=settings.API_V1_STR)
app.include_router(words_router, prefix=settings.API_V1_STR)
app.include_router(lessons_router, prefix=settings.API_V1_STR)
app.include_router(heritage_router, prefix=settings.API_V1_STR)
app.include_router(validations_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)

# Direct root-level aliases for OpenPay webhook (handles calls with or without /api/v1)
@app.post("/payments/openpay/webhook", include_in_schema=False)
@app.post("/payments/webhook/openpay", include_in_schema=False)
async def openpay_webhook_root_alias(request: Request):
    from .routers.payments import openpay_webhook
    from .database import get_db
    db = next(get_db())
    try:
        body = await request.json() if "json" in request.headers.get("content-type", "") else {}
        return await openpay_webhook(
            payload=body,
            request=request,
            x_signature=request.headers.get("x-signature"),
            x_openpay_signature=request.headers.get("x-openpay-signature"),
            xo_api_key=request.headers.get("xo-api-key"),
            x_api_key=request.headers.get("x-api-key"),
            authorization=request.headers.get("authorization"),
            db=db
        )
    finally:
        db.close()


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
