from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ..database import get_db
from ..models.word import Word
from ..models.validation import LinguisticValidation
from ..models.user import User
from ..schemas.word import WordCreate, WordOut
from ..auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/words", tags=["Dictionnaire & Vocabulaire"])

@router.get("/search", response_model=List[WordOut])
def search_words(
    q: Optional[str] = Query(None, description="Terme de recherche (Lari ou Français)"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    language: str = Query("LAR", description="Code de la langue (ex: LAR)"),
    validated_only: bool = Query(True, description="Uniquement les mots validés par les linguistes"),
    db: Session = Depends(get_db)
):
    query = db.query(Word).filter(Word.language_id == language)

    if validated_only:
        query = query.filter(Word.is_validated == True)

    if category and category != "Toutes":
        query = query.filter(Word.category == category)

    if q:
        search_fmt = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Word.word_native.ilike(search_fmt),
                Word.translation_fr.ilike(search_fmt),
                Word.translation_en.ilike(search_fmt)
            )
        )

    return query.all()

@router.get("/{word_id}", response_model=WordOut)
def get_word(word_id: str, db: Session = Depends(get_db)):
    word = db.query(Word).filter(Word.id == word_id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Mot non trouvé dans le dictionnaire.")
    return word

@router.post("/", response_model=WordOut, status_code=status.HTTP_201_CREATED)
def create_word(
    payload: WordCreate,
    current_user: User = Depends(require_roles(["LINGUIST", "ADMIN", "TEACHER"])),
    db: Session = Depends(get_db)
):
    is_auto_validated = current_user.role in ["LINGUIST", "ADMIN"]
    word = Word(
        language_id=payload.language_id,
        word_native=payload.word_native,
        phonetic=payload.phonetic,
        translation_fr=payload.translation_fr,
        translation_en=payload.translation_en,
        category=payload.category,
        difficulty_level=payload.difficulty_level,
        cultural_note=payload.cultural_note,
        example_sentence_native=payload.example_sentence_native,
        example_sentence_fr=payload.example_sentence_fr,
        audio_url=payload.audio_url,
        speaker_name=payload.speaker_name or current_user.full_name,
        is_validated=is_auto_validated
    )
    db.add(word)
    db.commit()
    db.refresh(word)

    # If created by a teacher, add to linguistic validation pipeline
    if not is_auto_validated:
        val = LinguisticValidation(
            entity_type="WORD",
            entity_id=word.id,
            validator_id=current_user.id,
            status="PENDING",
            comments="Proposé pour validation pédagogique"
        )
        db.add(val)
        db.commit()

    return word
