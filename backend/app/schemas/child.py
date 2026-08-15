from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChildCreate(BaseModel):
    first_name: str
    age_group: str # '3-5', '6-8', '9-11', '12-15'
    avatar_id: Optional[str] = "koko_happy"

class ChildUpdate(BaseModel):
    first_name: Optional[str] = None
    age_group: Optional[str] = None
    avatar_id: Optional[str] = None
    xp_points: Optional[int] = None
    level: Optional[int] = None
    current_streak: Optional[int] = None

class ChildOut(BaseModel):
    id: str
    parent_id: str
    first_name: str
    age_group: str
    avatar_id: str
    level: int
    xp_points: int
    current_streak: int
    created_at: datetime

    class Config:
        from_attributes = True
