from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from ..database import Base

class Word(Base):
    __tablename__ = "words"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    language_id = Column(String(10), ForeignKey("languages.id"), nullable=False, default="LAR")
    word_native = Column(String(200), nullable=False, index=True)
    phonetic = Column(String(200), nullable=True)
    translation_fr = Column(String(255), nullable=False, index=True)
    translation_en = Column(String(255), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    difficulty_level = Column(Integer, default=1)
    cultural_note = Column(Text, nullable=True)
    example_sentence_native = Column(Text, nullable=True)
    example_sentence_fr = Column(Text, nullable=True)
    audio_url = Column(String(500), nullable=True)
    speaker_name = Column(String(150), nullable=True)
    is_validated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    pronunciations = relationship("Pronunciation", back_populates="word", cascade="all, delete-orphan")

class Pronunciation(Base):
    __tablename__ = "pronunciations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    word_id = Column(String(36), ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
    audio_url = Column(String(500), nullable=False)
    speaker_name = Column(String(150), nullable=True)
    speaker_type = Column(String(50), default="NATIVE_ELDER") # NATIVE_ELDER, TEACHER, STUDIO
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    word = relationship("Word", back_populates="pronunciations")
