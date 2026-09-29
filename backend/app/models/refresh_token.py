from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True) # SHA-256 hex digest
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    replaced_by = Column(String(36), nullable=True) # ID du nouveau token si rotation
    user_agent = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)

    # Relation vers l'utilisateur
    user = relationship("User", back_populates="refresh_tokens")
