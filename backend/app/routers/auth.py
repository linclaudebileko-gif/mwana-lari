from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import UserRegister, UserLogin, DemoLoginRequest, Token, UserOut
from ..auth.security import get_password_hash, verify_password, create_access_token
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentification & Profils"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un compte avec cette adresse email existe déjà."
        )
    
    # Create new user
    user = User(
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name,
        phone_number=payload.phone_number,
        role=payload.role.upper(),
        country_code=payload.country_code
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate JWT
    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name
    )

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role,
        full_name=user.full_name
    )

@router.post("/demo-login", response_model=Token)
def demo_login(payload: DemoLoginRequest, db: Session = Depends(get_db)):
    role_email_map = {
        "parent": "parent@mwanalari.cg",
        "teacher": "enseignant@mwanalari.cg",
        "linguist": "linguiste@mwanalari.cg",
        "admin": "admin@mwanalari.cg",
    }
    target_email = role_email_map.get(payload.role.lower())
    if not target_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rôle de démonstration non reconnu."
        )

    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        # If demo user not yet in DB, find any user with that role or return 404
        user = db.query(User).filter(User.role == payload.role.upper()).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Compte de démonstration introuvable."
            )

    token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role})
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
