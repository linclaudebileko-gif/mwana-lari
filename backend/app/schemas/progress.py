from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProgressSubmit(BaseModel):
    child_id: str
    lesson_id: str
    score: int = 100
    xp_earned: int = 20

class ProgressOut(BaseModel):
    id: str
    child_id: str
    lesson_id: str
    score: int
    xp_earned: int
    completed_at: datetime

    class Config:
        from_attributes = True

class ChildStatsOut(BaseModel):
    child_id: str
    first_name: str
    level: int
    xp_points: int
    current_streak: int
    completed_lessons_count: int
    words_mastered_count: int
