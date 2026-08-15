from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.child import Child
from ..models.progress import ChildProgress
from ..schemas.child import ChildCreate, ChildUpdate, ChildOut
from ..schemas.progress import ChildStatsOut
from ..auth.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/parents", tags=["Espace Parents & Enfants"])

@router.post("/children", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
def create_child(
    payload: ChildCreate,
    current_user: User = Depends(require_roles(["PARENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    child = Child(
        parent_id=current_user.id,
        first_name=payload.first_name,
        age_group=payload.age_group,
        avatar_id=payload.avatar_id or "koko_happy",
        level=1,
        xp_points=0,
        current_streak=1
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    return child

@router.get("/children", response_model=List[ChildOut])
def get_parent_children(
    current_user: User = Depends(require_roles(["PARENT", "ADMIN", "TEACHER"])),
    db: Session = Depends(get_db)
):
    if current_user.role == "ADMIN":
        return db.query(Child).all()
    return db.query(Child).filter(Child.parent_id == current_user.id).all()

@router.get("/children/{child_id}/progress", response_model=ChildStatsOut)
def get_child_progress(
    child_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Enfant non trouvé.")
    
    # Check permission
    if current_user.role not in ["ADMIN", "TEACHER"] and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce profil enfant.")

    completed_count = db.query(ChildProgress).filter(ChildProgress.child_id == child_id).count()
    words_mastered = completed_count * 5 # average estimation

    return ChildStatsOut(
        child_id=child.id,
        first_name=child.first_name,
        level=child.level,
        xp_points=child.xp_points,
        current_streak=child.current_streak,
        completed_lessons_count=completed_count,
        words_mastered_count=words_mastered
    )

@router.patch("/children/{child_id}", response_model=ChildOut)
def update_child(
    child_id: str,
    payload: ChildUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Enfant non trouvé.")
    
    if current_user.role not in ["ADMIN"] and child.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action non autorisée.")

    if payload.first_name is not None:
        child.first_name = payload.first_name
    if payload.age_group is not None:
        child.age_group = payload.age_group
    if payload.avatar_id is not None:
        child.avatar_id = payload.avatar_id
    if payload.xp_points is not None:
        child.xp_points = payload.xp_points
    if payload.level is not None:
        child.level = payload.level
    if payload.current_streak is not None:
        child.current_streak = payload.current_streak

    db.commit()
    db.refresh(child)
    return child
