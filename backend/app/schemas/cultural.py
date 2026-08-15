from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StoryCreate(BaseModel):
    language_id: str = "LAR"
    type: str # 'STORY', 'PROVERB', 'SONG'
    title_native: str
    title_fr: str
    content_native: str
    content_fr: str
    audio_url: Optional[str] = None
    elder_speaker_name: Optional[str] = None
    duration_seconds: int = 60
    moral_lesson: Optional[str] = None
    category: str = "Contes"

class StoryOut(BaseModel):
    id: str
    language_id: str
    type: str
    title_native: str
    title_fr: str
    content_native: str
    content_fr: str
    audio_url: Optional[str] = None
    elder_speaker_name: Optional[str] = None
    duration_seconds: int
    moral_lesson: Optional[str] = None
    category: str
    is_validated: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ContributionCreate(BaseModel):
    type: str = "STORY"
    title_native: str
    title_fr: str
    content_native: str
    content_fr: str
    elder_speaker_name: str
    audio_url: Optional[str] = None
    moral_lesson: Optional[str] = None
