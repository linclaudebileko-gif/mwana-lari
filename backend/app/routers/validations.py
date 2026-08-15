from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.validation import LinguisticValidation
from ..models.word import Word
from ..models.cultural_story import CulturalStory
from ..models.user import User
from ..schemas.validation import ValidationOut, ValidationDecision
from ..auth.dependencies import require_roles

router = APIRouter(prefix="/admin/validations", tags=["Gouvernance & Validation Linguistique"])

@router.get("/pending", response_model=List[ValidationOut])
def get_pending_validations(
    current_user: User = Depends(require_roles(["LINGUIST", "ADMIN"])),
    db: Session = Depends(get_db)
):
    return db.query(LinguisticValidation).filter(LinguisticValidation.status == "PENDING").all()

@router.post("/{validation_id}/decide", response_model=ValidationOut)
def decide_validation(
    validation_id: str,
    payload: ValidationDecision,
    current_user: User = Depends(require_roles(["LINGUIST", "ADMIN"])),
    db: Session = Depends(get_db)
):
    val = db.query(LinguisticValidation).filter(LinguisticValidation.id == validation_id).first()
    if not val:
        raise HTTPException(status_code=404, detail="Demande de validation introuvable.")

    decision_status = payload.decision.upper()
    if decision_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Décision invalide. Choisissez 'APPROVED' ou 'REJECTED'.")

    val.status = decision_status
    val.validator_id = current_user.id
    if payload.comments:
        val.comments = payload.comments

    # Update corresponding target entity
    if val.entity_type == "WORD":
        word = db.query(Word).filter(Word.id == val.entity_id).first()
        if word:
            word.is_validated = (decision_status == "APPROVED")
    elif val.entity_type == "STORY":
        story = db.query(CulturalStory).filter(CulturalStory.id == val.entity_id).first()
        if story:
            story.is_validated = (decision_status == "APPROVED")

    db.commit()
    db.refresh(val)
    return val
