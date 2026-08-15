from .auth import router as auth_router
from .parents import router as parents_router
from .words import router as words_router
from .lessons import router as lessons_router
from .heritage import router as heritage_router
from .validations import router as validations_router

__all__ = [
    "auth_router",
    "parents_router",
    "words_router",
    "lessons_router",
    "heritage_router",
    "validations_router",
]
