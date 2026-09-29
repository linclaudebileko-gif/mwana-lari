import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.user import User
from ..schemas.auth import (
    UserRegister,
    UserLogin,
    DemoLoginRequest,
    Token,
    UserOut,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    SessionStatus,
)
from ..auth.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
    revoke_all_user_sessions,
    generate_csrf_token,
    create_password_reset_token,
    decode_password_reset_token,
)
from ..auth.password_policy import validate_password_policy
from ..auth.dependencies import get_current_user, get_optional_current_user, verify_csrf
from ..auth.rate_limiter import rate_limit
from ..config import settings

logger = logging.getLogger("mwana_lari_auth")

router = APIRouter(prefix="/auth", tags=["Authentification & Profils"])

def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: Optional[str] = None,
    csrf_token: Optional[str] = None
):
    """
    Sets hardened HttpOnly, Secure, SameSite cookies for user session and CSRF token.
    """
    # 1. Short-lived Access Token Cookie (15 min)
    response.set_cookie(
        key="mwana_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    # 2. Long-lived Refresh Token Cookie (7 days) restricted strictly to /auth path
    if refresh_token:
        response.set_cookie(
            key="mwana_refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
            path=f"{settings.API_V1_STR}/auth"
        )

    # 3. CSRF Token Cookie (accessible by JavaScript to attach X-CSRF-Token header)
    if csrf_token:
        response.set_cookie(
            key="mwana_csrf_token",
            value=csrf_token,
            httponly=False,
            secure=settings.COOKIE_SECURE,
            samesite=settings.COOKIE_SAMESITE,
            max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
            path="/"
        )

def _clear_auth_cookies(response: Response):
    """
    Clears all authentication and CSRF cookies on logout.
    """
    response.delete_cookie(
        key="mwana_access_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )
    response.delete_cookie(
        key="mwana_refresh_token",
        path=f"{settings.API_V1_STR}/auth",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )
    response.delete_cookie(
        key="mwana_refresh_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )
    response.delete_cookie(
        key="mwana_csrf_token",
        path="/",
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )

@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60, action="register"))]
)
def register(request: Request, payload: UserRegister, response: Response, db: Session = Depends(get_db)):
    # Password security policy enforcement (min 12 chars, passphrases, HIBP k-anonymity breach check)
    validate_password_policy(payload.password)

    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cette adresse email existe déjà."
        )
    
    # Restrict unprivileged registration roles (Least privilege: ADMIN and LINGUIST can never be self-assigned)
    user_role = payload.role.upper() if payload.role else "PARENT"
    if user_role not in ["PARENT", "TEACHER", "CHILD"]:
        user_role = "PARENT"

    # Create new user
    user = User(
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        phone_number=payload.phone_number,
        role=user_role,
        country_code=payload.country_code or "CG",
        token_version=1
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate Access Token, Refresh Token and CSRF Token
    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host if request.client else None
    raw_refresh_token, _ = create_refresh_token(user.id, db, user_agent=user_agent, ip_address=ip_address)
    access_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "ver": user.token_version or 1
    })
    csrf_token = generate_csrf_token()

    # Set hardened cookies
    _set_auth_cookies(response, access_token, raw_refresh_token, csrf_token)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        csrf_token=csrf_token
    )

@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(rate_limit(max_requests=8, window_seconds=60, action="login"))]
)
def login(request: Request, payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host if request.client else None
    raw_refresh_token, _ = create_refresh_token(user.id, db, user_agent=user_agent, ip_address=ip_address)
    access_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "ver": user.token_version or 1
    })
    csrf_token = generate_csrf_token()

    _set_auth_cookies(response, access_token, raw_refresh_token, csrf_token)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        csrf_token=csrf_token
    )

@router.post("/refresh", response_model=Token)
def refresh_session(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Performs secure refresh token rotation:
    1. Extracts refresh token from HttpOnly cookie (or optional body for API clients).
    2. Validates against database, checks expiration, and detects reuse.
    3. Invalides old token and issues fresh access + refresh + CSRF tokens.
    """
    raw_refresh_token = request.cookies.get("mwana_refresh_token")
    if not raw_refresh_token and payload and payload.refresh_token:
        raw_refresh_token = payload.refresh_token

    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token manquant ou session expirée."
        )

    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host if request.client else None

    # Rotate refresh token (with reuse detection and compromise revocation)
    new_access_token, new_raw_refresh, user = rotate_refresh_token(
        raw_refresh_token,
        db=db,
        user_agent=user_agent,
        ip_address=ip_address
    )

    csrf_token = generate_csrf_token()
    _set_auth_cookies(response, new_access_token, new_raw_refresh, csrf_token)

    return Token(
        access_token=new_access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        csrf_token=csrf_token
    )

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db)
):
    """
    Revokes the current refresh token in database and clears all authentication cookies.
    """
    raw_refresh = request.cookies.get("mwana_refresh_token")
    if not raw_refresh and payload and payload.refresh_token:
        raw_refresh = payload.refresh_token

    if raw_refresh:
        revoke_refresh_token(raw_refresh, db)

    _clear_auth_cookies(response)
    return {"status": "success", "message": "Session révoquée avec succès."}

@router.post("/logout-all")
def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Global session revocation:
    Increments user.token_version, immediately invalidating ALL access tokens and refresh tokens across all devices.
    """
    revoke_all_user_sessions(current_user.id, db)
    _clear_auth_cookies(response)
    return {"status": "success", "message": "Toutes vos sessions actives ont été déconnectées avec succès."}

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    request: Request,
    current_user: User = Depends(get_current_user),
    _csrf: None = Depends(verify_csrf),
    db: Session = Depends(get_db)
):
    """
    Changes user password and invalidates all other active sessions across devices.
    """
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe actuel est incorrect."
        )

    # Password security policy enforcement (min 12 chars, passphrases, HIBP k-anonymity breach check)
    validate_password_policy(payload.new_password)

    # 1. Update password hash (Argon2id)
    current_user.password_hash = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()

    # 2. Invalidate all existing sessions (increments token_version)
    revoke_all_user_sessions(current_user.id, db)
    db.refresh(current_user)

    # 3. Create fresh credentials for the current active session
    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host if request.client else None
    raw_refresh_token, _ = create_refresh_token(current_user.id, db, user_agent=user_agent, ip_address=ip_address)
    access_token = create_access_token(data={
        "sub": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "ver": current_user.token_version or 1
    })
    csrf_token = generate_csrf_token()

    _set_auth_cookies(response, access_token, raw_refresh_token, csrf_token)

    return {
        "status": "success",
        "message": "Mot de passe modifié avec succès. Toutes vos autres sessions ont été déconnectées."
    }

@router.post(
    "/forgot-password",
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60, action="forgot_password"))]
)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates a secure password reset flow.
    To prevent account enumeration, always returns a uniform response message.
    """
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    reset_token = None
    if user:
        reset_token = create_password_reset_token(user.id, user.email, user.token_version or 1)
        logger.info("Jeton de réinitialisation de mot de passe généré.")

    resp = {
        "status": "success",
        "message": "Si cette adresse email est associée à un compte, un lien de réinitialisation vous a été transmis."
    }
    if settings.ENVIRONMENT != "production" and reset_token:
        resp["reset_token"] = reset_token

    return resp

@router.post(
    "/reset-password",
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60, action="reset_password"))]
)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Resets password using a validated time-limited reset token.
    Enforces password security policy (min 12 chars, breach verification via k-anonymity)
    and invalidates all existing sessions across devices.
    """
    token_data = decode_password_reset_token(payload.token)
    if not token_data or not token_data.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Jeton de réinitialisation invalide ou expiré."
        )

    user_id = token_data.get("sub")
    token_version = token_data.get("ver")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or (user.token_version or 1) != token_version:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce lien de réinitialisation a déjà été utilisé ou a expiré."
        )

    # Enforce password policy (length >= 12, passphrases, Pwned Passwords k-anonymity check)
    validate_password_policy(payload.new_password)

    # 1. Update password hash (Argon2id)
    user.password_hash = get_password_hash(payload.new_password)
    db.add(user)
    db.commit()

    # 2. Invalidate all active sessions (increments token_version)
    revoke_all_user_sessions(user.id, db)

    return {
        "status": "success",
        "message": "Votre mot de passe a été réinitialisé avec succès. Vous pouvez désormais vous connecter."
    }

@router.get("/csrf")
def get_csrf_token(response: Response):
    """
    Issues or refreshes an anti-CSRF token cookie for the browser.
    """
    token = generate_csrf_token()
    response.set_cookie(
        key="mwana_csrf_token",
        value=token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/"
    )
    return {"csrf_token": token}

@router.post("/demo-login", response_model=Token)
def demo_login(
    request: Request,
    payload: DemoLoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    # Block in production unless explicitly enabled via environment variable
    if settings.ENVIRONMENT == "production" and not settings.ALLOW_DEMO_LOGIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Le mode de démonstration sans mot de passe est désactivé en production pour des raisons de sécurité."
        )

    # In demo mode, prevent elevation to ADMIN without credentials
    requested_role = payload.role.lower()
    if requested_role == "admin" and settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="L'accès administrateur requiert une authentification formelle par mot de passe."
        )

    role_email_map = {
        "parent": "parent@mwanalari.cg",
        "teacher": "enseignant@mwanalari.cg",
        "linguist": "linguiste@mwanalari.cg",
        "admin": "admin@mwanalari.cg",
    }
    target_email = role_email_map.get(requested_role)
    if not target_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rôle de démonstration non reconnu."
        )

    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        # Fallback to finding user by role
        user = db.query(User).filter(User.role == requested_role.upper()).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compte de démonstration introuvable."
            )

    user_agent = request.headers.get("User-Agent")
    ip_address = request.client.host if request.client else None
    raw_refresh_token, _ = create_refresh_token(user.id, db, user_agent=user_agent, ip_address=ip_address)
    access_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "ver": user.token_version or 1
    })
    csrf_token = generate_csrf_token()

    _set_auth_cookies(response, access_token, raw_refresh_token, csrf_token)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name,
        csrf_token=csrf_token
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/session", response_model=SessionStatus)
def check_session_status(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Lightweight endpoint to check if the browser has an active valid session without throwing 401.
    """
    csrf_token = request.cookies.get("mwana_csrf_token")
    if current_user:
        return SessionStatus(
            authenticated=True,
            user=UserOut.from_orm(current_user),
            csrf_token=csrf_token
        )
    return SessionStatus(authenticated=False, user=None, csrf_token=csrf_token)

