from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ValidationCreate(BaseModel):
    entity_type: str # 'WORD', 'STORY', 'PROVERB', 'PRONUNCIATION'
    entity_id: str
    comments: Optional[str] = None

class ValidationDecision(BaseModel):
    decision: str # 'APPROVED' or 'REJECTED'
    comments: Optional[str] = None

class ValidationOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    validator_id: str
    status: str
    comments: Optional[str] = None
    validated_at: datetime

    class Config:
        from_attributes = True
