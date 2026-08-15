from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
import uuid
from datetime import datetime
from ..database import Base

class CulturalStory(Base):
    __tablename__ = "cultural_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    language_id = Column(String(10), ForeignKey("languages.id"), nullable=False, default="LAR")
    type = Column(String(50), nullable=False) # 'STORY', 'PROVERB', 'SONG'
    title_native = Column(String(255), nullable=False)
    title_fr = Column(String(255), nullable=False)
    content_native = Column(Text, nullable=False)
    content_fr = Column(Text, nullable=False)
    audio_url = Column(String(500), nullable=True)
    elder_speaker_name = Column(String(150), nullable=True)
    duration_seconds = Column(Integer, default=60)
    moral_lesson = Column(Text, nullable=True)
    category = Column(String(100), default="Contes")
    is_validated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
