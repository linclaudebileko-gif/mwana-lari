from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class LinguisticValidation(Base):
    __tablename__ = "linguistic_validations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False) # 'WORD', 'STORY', 'PROVERB', 'PRONUNCIATION'
    entity_id = Column(String(36), nullable=False)
    validator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), nullable=False, default="PENDING") # 'PENDING', 'APPROVED', 'REJECTED'
    comments = Column(Text, nullable=True)
    validated_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    validator = relationship("User", back_populates="validations")
