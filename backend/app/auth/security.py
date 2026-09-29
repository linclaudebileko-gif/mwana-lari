import bcrypt
from argon2 import PasswordHasher, exceptions as argon2_exceptions
import hashlib
import hmac
import secrets
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from ..config import settings
from ..models.refresh_token import RefreshToken
from ..models.user import User
from fastapi import HTTPException, status

# Argon2id hasher configured per OWASP / RFC 9106 standards
# (Memory-hard: 64 MB RAM, 3 iterations, 4 parallelism lanes)
argon2_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

def get_password_hash(password: str) -> str:
    """
    Hashes a password using Argon2id.
    Unlike bcrypt, Argon2id does not truncate long passphrases to 72 bytes.
    """
    return argon2_hasher.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against its stored hash.
    Supports Argon2id for new hashes and maintains backward compatibility
    with existing bcrypt hashes without ever deciphering passwords.
    """
    if not plain_password or not hashed_password:
        return False

    # 1. Argon2id check
    if hashed_password.startswith("$argon2id$") or hashed_password.startswith("$argon2"):
        try:
            return argon2_hasher.verify(hashed_password, plain_password)
        except (argon2_exceptions.VerifyMismatchError, argon2_exceptions.VerificationError, argon2_exceptions.InvalidHashError):
            return False
        except Exception:
            return False

    # 2. Legacy bcrypt check (backward compatibility)
    if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            plain_bytes = plain_password.encode('utf-8')[:72]
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(plain_bytes, hashed_bytes)
        except Exception:
            return False

    return False

def hash_token(token: str) -> str:
    """Calculates SHA-256 hex digest of a token string for safe storage in DB."""
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed, short-lived JWT access token (default: 15 minutes).
    Includes creation timestamp and type marker.
    """
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decodes and verifies a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Validate that this is strictly an access token
        if payload.get("type") and payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None

def create_password_reset_token(user_id: str, email: str, token_version: int, expires_minutes: int = 30) -> str:
    """
    Creates a signed, time-limited token for password reset (default 30 min).
    Tied to the user's current token_version so it cannot be reused after password update.
    """
    now = datetime.utcnow()
    expire = now + timedelta(minutes=expires_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "ver": token_version,
        "type": "password_reset",
        "iat": now,
        "exp": expire
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_password_reset_token(token: str) -> Optional[dict]:
    """Decodes and validates a password reset token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except JWTError:
        return None

# =========================================================================
# REFRESH TOKENS & SESSION MANAGEMENT (Rotation, Revocation, Reuse Detection)
# =========================================================================

def create_refresh_token(
    user_id: str,
    db: Session,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Tuple[str, RefreshToken]:
    """
    Generates a cryptographically strong refresh token and persists its SHA-256 hash.
    Returns (raw_refresh_token, db_record).
    """
    raw_token = secrets.token_urlsafe(64)
    token_digest = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    token_record = RefreshToken(
        user_id=user_id,
        token_hash=token_digest,
        expires_at=expires_at,
        created_at=datetime.utcnow(),
        user_agent=user_agent[:255] if user_agent else None,
        ip_address=ip_address[:45] if ip_address else None
    )
    db.add(token_record)
    db.commit()
    db.refresh(token_record)
    return raw_token, token_record

def rotate_refresh_token(
    raw_refresh_token: str,
    db: Session,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Tuple[str, str, User]:
    """
    Performs secure Refresh Token Rotation according to RFC 6749 / OAuth 2.0 Threat Model:
    1. Validates the incoming refresh token.
    2. REUSE DETECTION: If a previously rotated or revoked token is reused,
       it indicates token theft! All active sessions for this user are instantly revoked.
    3. If valid: revokes the old token, issues a new refresh token, and creates a fresh access token.
    Returns (new_access_token, new_refresh_token, user).
    """
    token_digest = hash_token(raw_refresh_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_digest).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalide ou inexistante."
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur introuvable."
        )

    # 1. Reuse detection: if this token was already revoked / replaced
    if record.revoked_at is not None:
        # Compromise detected! Invalidate all sessions for this user
        revoke_all_user_sessions(user.id, db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Activité suspecte détectée (tentative de rejeu de session). Toutes les sessions actives ont été révoquées par mesure de sécurité."
        )

    # 2. Expiration check
    if record.expires_at < datetime.utcnow():
        record.revoked_at = datetime.utcnow()
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La session a expiré. Veuillez vous reconnecter."
        )

    # 3. Valid: create new refresh token
    new_raw_token, new_record = create_refresh_token(
        user_id=user.id,
        db=db,
        user_agent=user_agent,
        ip_address=ip_address
    )

    # 4. Mark old token as revoked and link replacement
    record.revoked_at = datetime.utcnow()
    record.replaced_by = new_record.id
    db.commit()

    # 5. Create fresh access token with current token_version
    new_access_token = create_access_token(data={
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "ver": user.token_version or 1
    })

    return new_access_token, new_raw_token, user

def revoke_refresh_token(raw_refresh_token: str, db: Session) -> bool:
    """Revokes a specific refresh token (used on single-device logout)."""
    token_digest = hash_token(raw_refresh_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_digest).first()
    if record and not record.revoked_at:
        record.revoked_at = datetime.utcnow()
        db.commit()
        return True
    return False

def revoke_all_user_sessions(user_id: str, db: Session):
    """
    Revokes ALL sessions for a user:
    - Marks all active refresh tokens as revoked.
    - Increments user.token_version, immediately invalidating any active access tokens.
    """
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None)
    ).update({"revoked_at": datetime.utcnow()})

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.token_version = (user.token_version or 1) + 1
        db.add(user)

    db.commit()

# =========================================================================
# CSRF PROTECTION (Double-Submit Cookie & Synchronizer Validation)
# =========================================================================

def generate_csrf_token() -> str:
    """Generates a high-entropy URL-safe anti-CSRF token."""
    return secrets.token_urlsafe(32)

def validate_csrf_token(token_from_header: Optional[str], token_from_cookie: Optional[str]) -> bool:
    """
    Validates CSRF token using constant-time string comparison to prevent timing attacks.
    Both tokens must be non-empty and match exactly.
    """
    if not token_from_header or not token_from_cookie:
        return False
    return hmac.compare_digest(token_from_header.strip(), token_from_cookie.strip())

