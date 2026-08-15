from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class ChildProgress(Base):
    __tablename__ = "child_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    child_id = Column(String(36), ForeignKey("children.id", ondelete="CASCADE"), nullable=False)
    lesson_id = Column(String(100), nullable=False)
    score = Column(Integer, default=100)
    xp_earned = Column(Integer, default=20)
    completed_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('child_id', 'lesson_id', name='uq_child_lesson'),
    )

    # Relationships
    child = relationship("Child", back_populates="progress_records")
