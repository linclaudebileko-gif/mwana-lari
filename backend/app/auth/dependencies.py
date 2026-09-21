from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from .security import decode_access_token
from typing import List, Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    token_header: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Extracts and validates current user from either:
    1. HttpOnly Secure Cookie ('mwana_access_token' or 'access_token')
    2. Authorization Bearer header
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identifiants invalides ou session expirée.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 1. Look in explicit Authorization Header first
    token = None
    if token_header:
        token = token_header
    elif request.headers.get("Authorization") and request.headers.get("Authorization").startswith("Bearer "):
        token = request.headers.get("Authorization")[7:].strip()
        
    # 2. Fallback to HttpOnly cookies
    if not token:
        token = request.cookies.get("mwana_access_token") or request.cookies.get("access_token")
            
    if not token:
        raise credentials_exception
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_optional_current_user(
    request: Request,
    token_header: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Tente d'extraire l'utilisateur courant sans lever d'exception s'il n'est pas authentifié.
    """
    token = None
    if token_header:
        token = token_header
    elif request.headers.get("Authorization") and request.headers.get("Authorization").startswith("Bearer "):
        token = request.headers.get("Authorization")[7:].strip()
    if not token:
        token = request.cookies.get("mwana_access_token") or request.cookies.get("access_token")
    if not token:
        return None
    
    payload = decode_access_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    return db.query(User).filter(User.id == user_id).first()

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès refusé. Rôles autorisés: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

