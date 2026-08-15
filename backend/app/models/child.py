from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class Child(Base):
    __tablename__ = "children"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    age_group = Column(String(20), nullable=False) # '3-5', '6-8', '9-11', '12-15'
    avatar_id = Column(String(100), default="koko_happy")
    level = Column(Integer, default=1)
    xp_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parent = relationship("User", back_populates="children")
    progress_records = relationship("ChildProgress", back_populates="child", cascade="all, delete-orphan")
