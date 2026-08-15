from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..models.child import Child
from ..models.progress import ChildProgress
from ..schemas.progress import ProgressSubmit, ProgressOut

router = APIRouter(prefix="", tags=["Académie & Progression"])

# Static pedagogical units structure defined by curriculum (529 Words Lari Standard)
LESSON_ROADMAP = [
    {
        "id": "l1",
        "level": 1,
        "title_fr": "Unité 1 : Salutations, Politesse & Famille",
        "title_native": "Mbote na Nzo ya Kanda",
        "description": "Apprends les formules fondamentales (« Mbote », « Bweni ? », « Ntondele ») et les membres du foyer (« Mama », « Tata », « Mbuta »).",
        "icon": "👋",
        "word_count": 40,
    },
    {
        "id": "l2",
        "level": 1,
        "title_fr": "Unité 2 : Le Corps Humain & La Santé",
        "title_native": "Nitu na Mabuka",
        "description": "Nomme les parties du corps (« Ntu », « Meso », « Moko », « Ntima », « Kulu ») et l'énergie du corps (« Nitu ya ngolo »).",
        "icon": "🏃",
        "word_count": 45,
    },
    {
        "id": "l3",
        "level": 2,
        "title_fr": "Unité 3 : Les Animaux de la Savane & Forêt",
        "title_native": "Biyilu bi Mfinda na Savane",
        "description": "Reconnais les animaux emblématiques (« Nkosi », « Ngo », « Nuni », « Mbisi », « Nioka ») et leurs sons.",
        "icon": "🦁",
        "word_count": 50,
    },
    {
        "id": "l4",
        "level": 2,
        "title_fr": "Unité 4 : La Cuisine Congolaise & Plats du Terroir",
        "title_native": "Madiya ma Terroir : Saka-saka, Maboke, Kwanga",
        "description": "Découvre les saveurs du Pool (« Saka-saka », « Maboke », « Kikwanga », « Bitoto », « Ngoki », « Nsafu », « Makemba »).",
        "icon": "🍲",
        "word_count": 55,
    },
    {
        "id": "l5",
        "level": 3,
        "title_fr": "Unité 5 : La Maison, le Foyer & les Objets",
        "title_native": "Nzo, Matoko na Bima bia Foyer",
        "description": "Les pièces de la maison (« Nzo a madiya », « Kuku »), les meubles et objets traditionnels (« Matoko », « Nsaba », « Kinzu »).",
        "icon": "🏡",
        "word_count": 50,
    },
    {
        "id": "l6",
        "level": 3,
        "title_fr": "Unité 6 : Métiers & Artisanat d'Art du Pool",
        "title_native": "Misalu, Kinkete na Banganga",
        "description": "Les métiers du terroir (« Nlongi », « Mukumbi », « Ntungi », « Mufubi », « Mulombi », « Nganga-buka »).",
        "icon": "🛠️",
        "word_count": 55,
    },
    {
        "id": "l7",
        "level": 4,
        "title_fr": "Unité 7 : La Nature, les Éléments & le Fleuve Congo",
        "title_native": "Nzadi, Mfinda, Zulu na Ntoto",
        "description": "Décris les paysages grandioses (« Nzadi », « Nkondo », « Loufoulakari », « Mvula », « Zulu dya nkembo »).",
        "icon": "🌊",
        "word_count": 60,
    },
    {
        "id": "l8",
        "level": 4,
        "title_fr": "Unité 8 : Le Temps, Saisons & Nombres (1 à 1 000)",
        "title_native": "Ntangu, Mimvu na Kazi mosi",
        "description": "Maîtrise le comptage étendu de « Mosi » (1) à « Kazi » (1 000), les jours, mois et saisons du Pool.",
        "icon": "🔢",
        "word_count": 60,
    },
    {
        "id": "l9",
        "level": 5,
        "title_fr": "Unité 9 : Sentiments, Sagesse & Relations Humaines",
        "title_native": "Bumuntu, Kiese, Zola na Ngemba",
        "description": "La philosophie humaniste Kongo (« Bumuntu »), l'amour filial (« Zola »), la paix (« Ngemba ») et la solidarité (« Kinsiona »).",
        "icon": "❤️",
        "word_count": 55,
    },
    {
        "id": "l10",
        "level": 5,
        "title_fr": "Unité 10 : Histoire du Royaume Kongo & Proverbes Royaux",
        "title_native": "Kongo dia Ntotila, Matsoua na Bingana",
        "description": "L'épopée de Mbanza Kongo, les figures de la résistance (André Matsoua, Boueta Mbongo) et les grands proverbes séculaires.",
        "icon": "👑",
        "word_count": 60,
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
