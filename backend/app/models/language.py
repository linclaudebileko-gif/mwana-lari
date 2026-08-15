from sqlalchemy import Column, String, Boolean, DateTime
from datetime import datetime
from ..database import Base

class Language(Base):
    __tablename__ = "languages"

    id = Column(String(10), primary_key=True, index=True) # e.g., 'LAR', 'LIN', 'KIK'
    name = Column(String(100), nullable=False)
    iso_code = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
