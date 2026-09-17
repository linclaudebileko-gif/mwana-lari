from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import UserRegister, UserLogin, DemoLoginRequest, Token, UserOut
from ..auth.security import get_password_hash, verify_password, create_access_token
from ..auth.dependencies import get_current_user
from ..auth.rate_limiter import rate_limit
from ..config import settings

router = APIRouter(prefix="/auth", tags=["Authentification & Profils"])

def _set_auth_cookie(response: Response, token: str):
    """
    Sets a hardened HttpOnly, Secure, SameSite cookie for the user session.
    """
    is_production = (settings.ENVIRONMENT == "production")
    response.set_cookie(
        key="mwana_access_token",
        value=token,
        httponly=True,
        secure=is_production,
        samesite="lax" if not is_production else "none",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(max_requests=5, window_seconds=60, action="register"))]
)
def register(payload: UserRegister, response: Response, db: Session = Depends(get_db)):
    # Password complexity / minimum length check
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit comporter au moins 8 caractères."
        )

    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cette adresse email existe déjà."
        )
    
    # Restrict unprivileged registration roles
    user_role = payload.role.upper() if payload.role else "PARENT"
    if user_role not in ["PARENT", "TEACHER", "LINGUIST", "CHILD"]:
        user_role = "PARENT"

    # Create new user
    user = User(
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        phone_number=payload.phone_number,
        role=user_role,
        country_code=payload.country_code or "CG"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate JWT & set HttpOnly Secure Cookie
    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    _set_auth_cookie(response, token)

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name
    )

@router.post(
    "/login",
    response_model=Token,
    dependencies=[Depends(rate_limit(max_requests=8, window_seconds=60, action="login"))]
)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    _set_auth_cookie(response, token)

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name
    )

@router.post("/logout")
def logout(response: Response):
    """
    Clears the HttpOnly authentication cookie.
    """
    is_production = (settings.ENVIRONMENT == "production")
    response.delete_cookie(
        key="mwana_access_token",
        path="/",
        secure=is_production,
        samesite="lax" if not is_production else "none"
    )
    return {"status": "success", "message": "Session révoquée avec succès."}

@router.post("/demo-login", response_model=Token)
def demo_login(payload: DemoLoginRequest, response: Response, db: Session = Depends(get_db)):
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

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    _set_auth_cookie(response, token)

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
