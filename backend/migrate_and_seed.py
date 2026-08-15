"""
Script de migration et d'initialisation pour base de données en ligne (PostgreSQL / Supabase / Neon / Render)
Usage:
    python backend/migrate_and_seed.py
    DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/mwana_db" python backend/migrate_and_seed.py
"""
import os
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.database import engine, Base
from app.seed.seed_data import seed_database
from app.config import settings

def run_migration():
    print("=" * 60)
    print("[MWANA LARI] MIGRATION ET SEEDING CLOUD DATABASE")
    print("=" * 60)
    print(f"[*] Moteur de base de donnees : {settings.normalized_database_url.split('@')[-1] if '@' in settings.normalized_database_url else settings.normalized_database_url}")

    
    try:
        # Test connection
        with engine.connect() as conn:
            print("[OK] Connexion a la base de donnees reussie !")
        
        # Create all tables
        print("[*] Creation des tables SQL (Users, Children, Words, Stories, Subscriptions, Payments)...")
        Base.metadata.create_all(bind=engine)
        print("[OK] Toutes les tables ont ete creees avec succes !")
        
        # Populate initial data
        print("[*] Seeding des donnees initiales (529 mots Lari, Contes, Forfaits MoMo, Comptes Demo)...")
        seed_database()
        print("[OK] Migration et Seeding termines avec succes !")
        print("=" * 60)
    except Exception as e:
        print(f"[ERREUR] Echec lors de la migration : {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
