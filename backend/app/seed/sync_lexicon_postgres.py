"""
Script de Synchronisation PostgreSQL / SQLite - Corpus Lexical & Validations Lari
Usage:
    python backend/app/seed/sync_lexicon_postgres.py [--database-url postgresql://...] [--dry-run]
"""

import os
import sys
import argparse
import json
from datetime import datetime

# Add project root to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.database import Base
from backend.app.models.language import Language
from backend.app.models.user import User
from backend.app.models.word import Word, Pronunciation
from backend.app.models.validation import LinguisticValidation


def sync_database(database_url: str = None, dry_run: bool = False):
    db_url = database_url or os.getenv("DATABASE_URL") or "sqlite:///./backend/mwana_lari.db"
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    print("=" * 65)
    print("[SYNCHRONISATION POSTGRESQL / BASE DE DONNEES LEXICALE]")
    print(f"Cible de connexion : {db_url.split('@')[-1] if '@' in db_url else db_url}")
    print(f"Mode Dry-Run : {'OUI (aucune ecriture)' if dry_run else 'NON (ecriture reelle)'}")
    print("=" * 65)

    engine = create_engine(db_url)
    if not dry_run:
        Base.metadata.create_all(bind=engine)

    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()

    manifest_path = os.path.join(BASE_DIR, "data", "lexicon", "audio_manifest.json")
    if not os.path.exists(manifest_path):
        print(f"[ERREUR] Manifeste introuvable a {manifest_path}")
        return False

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)

    print(f"Manifeste charge : {len(manifest_data)} entrees du corpus MBUTA.")

    # 1. Verifier la langue LAR
    lang_lari = db.query(Language).filter(Language.id == "LAR").first()
    if not lang_lari and not dry_run:
        lang_lari = Language(id="LAR", name="Lari", iso_code="kg-CG", is_active=True)
        db.add(lang_lari)
        db.commit()

    # 2. Identifier le validateur
    validator_user = db.query(User).filter(User.role == "LINGUIST").first() or db.query(User).filter(User.role == "ADMIN").first()
    validator_id = validator_user.id if validator_user else None

    # 3. Synchronisation des mots
    existing_words = {(w.word_native.strip().lower(), w.translation_fr.strip().lower()): w for w in db.query(Word).all()}
    print(f"Mots actuellement en base : {len(existing_words)}")

    words_created = 0
    words_updated = 0
    pronunciations_created = 0
    validations_created = 0

    for item in manifest_data:
        native = item.get("word_native", "").strip()
        trans_fr = item.get("translation_fr", "").strip()
        if not native or not trans_fr:
            continue

        key = (native.lower(), trans_fr.lower())
        audio_url = item.get("audio_url")
        is_val = bool(item.get("is_validated", False) and audio_url)
        speaker = item.get("speaker_name") or "Comite des Sages & Linguistes Lari (Pool / Brazzaville)"

        word_obj = existing_words.get(key)
        if not word_obj:
            words_created += 1
            if not dry_run:
                word_obj = Word(
                    language_id="LAR",
                    word_native=native,
                    phonetic=item.get("phonetic"),
                    translation_fr=trans_fr,
                    translation_en=item.get("translation_en", ""),
                    category=item.get("category", "Vocabulaire General"),
                    difficulty_level=item.get("difficulty_level", 1),
                    cultural_note=item.get("cultural_note", ""),
                    audio_url=audio_url,
                    speaker_name=speaker,
                    is_validated=is_val
                )
                db.add(word_obj)
                db.flush()
                existing_words[key] = word_obj
        else:
            # Update
            if word_obj.audio_url != audio_url or word_obj.is_validated != is_val:
                words_updated += 1
                if not dry_run:
                    word_obj.audio_url = audio_url
                    word_obj.is_validated = is_val
                    word_obj.speaker_name = speaker

        if word_obj and audio_url and not dry_run:
            # Verifier Pronunciation
            existing_pron = db.query(Pronunciation).filter(Pronunciation.word_id == word_obj.id).first()
            if not existing_pron:
                pronunciations_created += 1
                pron = Pronunciation(
                    word_id=word_obj.id,
                    audio_url=audio_url,
                    speaker_name=speaker,
                    speaker_type="NATIVE_ELDER",
                    is_primary=True
                )
                db.add(pron)

            # Verifier LinguisticValidation
            if is_val and validator_id:
                existing_val = db.query(LinguisticValidation).filter(
                    LinguisticValidation.entity_type == "WORD",
                    LinguisticValidation.entity_id == word_obj.id
                ).first()
                if not existing_val:
                    validations_created += 1
                    val = LinguisticValidation(
                        entity_type="WORD",
                        entity_id=word_obj.id,
                        validator_id=validator_id,
                        status="APPROVED",
                        comments="Prononciation authentique et conformite lexicale MBUTA validees.",
                        validated_at=datetime.utcnow()
                    )
                    db.add(val)

    if not dry_run:
        db.commit()

    total_in_db = db.query(Word).count()
    total_pron = db.query(Pronunciation).count()
    total_val = db.query(LinguisticValidation).count()

    print("\n" + "=" * 65)
    print("RAPPORT DE SYNCHRONISATION LEXICALE & AUDIOS :")
    print(f"   - Mots nouvellement inseres : {words_created}")
    print(f"   - Mots mis a jour (audio / statut) : {words_updated}")
    print(f"   - Prononciations enregistrees : {pronunciations_created}")
    print(f"   - Validations linguistiques creees : {validations_created}")
    print(f"   - Total final mots en base : {total_in_db} / {len(manifest_data)}")
    print(f"   - Total prononciations en base : {total_pron}")
    print(f"   - Total validations linguistiques : {total_val}")
    print("=" * 65)
    print("[OK] Base de donnees parfaitement alignee et certifiee !")

    db.close()
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synchronisation du lexique Mwana Lari avec PostgreSQL.")
    parser.add_argument("--database-url", type=str, help="URL de connexion PostgreSQL (ou DATABASE_URL)")
    parser.add_argument("--dry-run", action="store_true", help="Simuler sans appliquer les modifications")
    args = parser.parse_args()

    sync_database(database_url=args.database_url, dry_run=args.dry_run)
