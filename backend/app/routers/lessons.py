from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.child import Child
from ..models.progress import ChildProgress
from ..schemas.progress import ProgressSubmit, ProgressOut

router = APIRouter(prefix="", tags=["Académie & Progression"])

# Static pedagogical units structure defined by curriculum
LESSON_ROADMAP = [
    {
        "id": "l1",
        "level": 1,
        "title_fr": "Les Salutations & Politesse",
        "title_native": "Mbote na Beno",
        "description": "Apprends à saluer tes parents, tes amis et les anciens en Lari.",
        "icon": "👋",
        "word_count": 5,
    },
    {
        "id": "l2",
        "level": 1,
        "title_fr": "La Famille & Le Foyer",
        "title_native": "Nzo na Bakulu",
        "description": "Nomme ta maman, ton papa, tes frères et la maison.",
        "icon": "🏡",
        "word_count": 6,
    },
    {
        "id": "l3",
        "level": 1,
        "title_fr": "Les Animaux de la Savane",
        "title_native": "Bimbulu bi Zamba",
        "description": "Découvre le lion, le chien et les oiseaux.",
        "icon": "🦁",
        "word_count": 5,
    },
    {
        "id": "l4",
        "level": 2,
        "title_fr": "Les Chiffres & Compter (1 à 10)",
        "title_native": "Mu Tanga Mosi Tatu",
        "description": "Compte les fruits et les objets de la maison.",
        "icon": "🔢",
        "word_count": 8,
    },
    {
        "id": "l5",
        "level": 2,
        "title_fr": "Exprimer ses Émotions",
        "title_native": "Kiese na Nzola",
        "description": "Dire 'Je suis content', 'J'ai faim', 'J'aime'.",
        "icon": "❤️",
        "word_count": 7,
    },
]

@router.get("/lessons")
def get_lessons(
    child_id: str = Query(None, description="ID de l'enfant pour calculer le déblocage"),
    language: str = Query("LAR"),
    db: Session = Depends(get_db)
):
    completed_lesson_ids = set()
    if child_id:
        records = db.query(ChildProgress.lesson_id).filter(ChildProgress.child_id == child_id).all()
        completed_lesson_ids = {r[0] for r in records}

    result = []
    for idx, unit in enumerate(LESSON_ROADMAP):
        is_completed = unit["id"] in completed_lesson_ids
        is_unlocked = idx == 0 or (LESSON_ROADMAP[idx - 1]["id"] in completed_lesson_ids)
        result.append({
            **unit,
            "is_completed": is_completed,
            "is_unlocked": is_unlocked,
            "progress_percent": 100 if is_completed else (40 if is_unlocked else 0)
        })

    return result

@router.post("/progress/submit", response_model=ProgressOut, status_code=status.HTTP_201_CREATED)
def submit_progress(payload: ProgressSubmit, db: Session = Depends(get_db)):
    child = db.query(Child).filter(Child.id == payload.child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Profil enfant non trouvé.")

    # Check if existing record
    record = db.query(ChildProgress).filter(
        ChildProgress.child_id == payload.child_id,
        ChildProgress.lesson_id == payload.lesson_id
    ).first()

    if not record:
        record = ChildProgress(
            child_id=payload.child_id,
            lesson_id=payload.lesson_id,
            score=payload.score,
            xp_earned=payload.xp_earned
        )
        db.add(record)
        # Update child XP & streaks
        child.xp_points += payload.xp_earned
        child.current_streak += 1
        # Level up every 100 XP
        new_level = (child.xp_points // 100) + 1
        if new_level > child.level:
            child.level = new_level
    else:
        # Update existing score if higher
        if payload.score > record.score:
            record.score = payload.score

    db.commit()
    db.refresh(record)
    return record
