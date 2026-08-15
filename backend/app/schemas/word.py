from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WordCreate(BaseModel):
    language_id: str = "LAR"
    word_native: str
    phonetic: Optional[str] = None
    translation_fr: str
    translation_en: Optional[str] = None
    category: str
    difficulty_level: int = 1
    cultural_note: Optional[str] = None
    example_sentence_native: Optional[str] = None
    example_sentence_fr: Optional[str] = None
    audio_url: Optional[str] = None
    speaker_name: Optional[str] = None

class WordOut(BaseModel):
    id: str
    language_id: str
    word_native: str
    phonetic: Optional[str] = None
    translation_fr: str
    translation_en: Optional[str] = None
    category: str
    difficulty_level: int
    cultural_note: Optional[str] = None
    example_sentence_native: Optional[str] = None
    example_sentence_fr: Optional[str] = None
    audio_url: Optional[str] = None
    speaker_name: Optional[str] = None
    is_validated: bool
    created_at: datetime

    class Config:
        from_attributes = True
