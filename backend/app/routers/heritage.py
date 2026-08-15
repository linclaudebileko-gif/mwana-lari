from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.cultural_story import CulturalStory
from ..models.validation import LinguisticValidation
from ..models.user import User
from ..schemas.cultural import StoryOut, StoryCreate, ContributionCreate
from ..auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/heritage", tags=["Nzolo ya Bakulu (Patrimoine & Contes)"])

@router.get("/stories", response_model=List[StoryOut])
def get_stories(
    type: Optional[str] = Query(None, description="Filtrer par type (STORY, PROVERB, SONG)"),
    language: str = Query("LAR"),
    db: Session = Depends(get_db)
):
    query = db.query(CulturalStory).filter(
        CulturalStory.language_id == language,
        CulturalStory.is_validated == True
    )
    if type:
        query = query.filter(CulturalStory.type == type.upper())
    return query.all()

@router.get("/stories/{story_id}", response_model=StoryOut)
def get_story(story_id: str, db: Session = Depends(get_db)):
    story = db.query(CulturalStory).filter(CulturalStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Conte ou proverbe non trouvé.")
    return story

@router.post("/contribute", response_model=StoryOut, status_code=status.HTTP_201_CREATED)
def contribute_story(
    payload: ContributionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Auto-validate if admin or linguist, else put to pending
    is_auto = current_user.role in ["LINGUIST", "ADMIN"]
    story = CulturalStory(
        language_id="LAR",
        type=payload.type,
        title_native=payload.title_native,
        title_fr=payload.title_fr,
        content_native=payload.content_native,
        content_fr=payload.content_fr,
        audio_url=payload.audio_url,
        elder_speaker_name=payload.elder_speaker_name,
        moral_lesson=payload.moral_lesson,
        category="Contributions Aînés",
        is_validated=is_auto
    )
    db.add(story)
    db.commit()
    db.refresh(story)

    # Queue for linguistic validation
    if not is_auto:
        val = LinguisticValidation(
            entity_type="STORY",
            entity_id=story.id,
            validator_id=current_user.id,
            status="PENDING",
            comments=f"Contribution transmise par {payload.elder_speaker_name}"
        )
        db.add(val)
        db.commit()

    return story
