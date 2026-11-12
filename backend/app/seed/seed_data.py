from sqlalchemy.orm import Session
from ..database import engine, SessionLocal, Base
from ..models.language import Language
from ..models.user import User
from ..models.child import Child
from ..models.word import Word, Pronunciation
from ..models.cultural_story import CulturalStory
from ..models.validation import LinguisticValidation
from ..auth.security import get_password_hash

def seed_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Ensure schema migrations for existing databases
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1"))
            conn.commit()
    except Exception:
        pass

    for col, col_type in [
        ("applied_at", "DATETIME"),
        ("is_applied", "BOOLEAN DEFAULT 0"),
        ("consultation_token", "VARCHAR(64)")
    ]:
        try:
            from sqlalchemy import text
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE payment_transactions ADD COLUMN {col} {col_type}"))
                conn.commit()
        except Exception:
            pass

    db: Session = SessionLocal()

    try:
        print("[SEED] Demarrage du Seeding de la base de donnees Mwana Lari...")

        # 1. Seed Languages
        if not db.query(Language).filter(Language.id == "LAR").first():
            languages = [
                Language(id="LAR", name="Lari", iso_code="kg-CG", is_active=True),
                Language(id="LIN", name="Lingala", iso_code="ln-CG", is_active=True),
                Language(id="KIK", name="Kikongo", iso_code="kg-CD", is_active=True),
            ]
            db.add_all(languages)
            db.commit()
            print("[SEED] OK - Langues enregistrees (Lari, Lingala, Kikongo).")

        # 2. Seed Users
        admin_user = db.query(User).filter(User.email == "admin@mwanalari.cg").first()
        if not admin_user:
            import os
            import secrets
            default_demo_pwd = os.getenv("DEMO_USERS_PASSWORD") or secrets.token_urlsafe(16)
            admin_pwd = os.getenv("DEFAULT_ADMIN_PASSWORD") or default_demo_pwd

            admin_user = User(
                email="admin@mwanalari.cg",
                password_hash=get_password_hash(admin_pwd),
                full_name="Professeur Massamba (Linguiste en Chef)",
                role="ADMIN",
                country_code="CG"
            )
            linguist_user = User(
                email="linguiste@mwanalari.cg",
                password_hash=get_password_hash(default_demo_pwd),
                full_name="Mamma Pauline (Comite Linguistique Lari)",
                role="LINGUIST",
                country_code="CG"
            )
            parent_user = User(
                email="parent@mwanalari.cg",
                password_hash=get_password_hash(default_demo_pwd),
                full_name="Mavoungou Jean (Parent)",
                role="PARENT",
                country_code="CG"
            )
            teacher_user = User(
                email="enseignant@mwanalari.cg",
                password_hash=get_password_hash(default_demo_pwd),
                full_name="Maitre Clarisse (Ecole de Bacongo)",
                role="TEACHER",
                country_code="CG"
            )
            db.add_all([admin_user, linguist_user, parent_user, teacher_user])
            db.commit()
            db.refresh(parent_user)
            print("[SEED] OK - Utilisateurs demo crees (Admin, Linguiste, Parent, Enseignant).")

            # 3. Seed Child Profile for Parent
            child_kamba = Child(
                parent_id=parent_user.id,
                first_name="Kamba",
                age_group="6-8",
                avatar_id="koko_happy",
                level=1,
                xp_points=240,
                current_streak=6
            )
            db.add(child_kamba)
            db.commit()
            print("[SEED] OK - Profil enfant 'Kamba' cree pour le parent demo.")

        # 4. Seed Lari Vocabulary Words, Pronunciations & Linguistic Validations
        import json
        import os

        manifest_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "lexicon", "audio_manifest.json"))
        lex_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "lexicon", "dictionnaire_lari_francais.json"))

        manifest_data = []
        if os.path.exists(manifest_path):
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)
        elif os.path.exists(lex_path):
            with open(lex_path, "r", encoding="utf-8") as f:
                manifest_data = json.load(f)

        if manifest_data:
            validator_user = db.query(User).filter(User.role == "LINGUIST").first() or admin_user
            current_word_count = db.query(Word).count()

            if current_word_count < len(manifest_data):
                print(f"[SEED] Synchronisation de l'integralite du corpus ({len(manifest_data)} mots)...")
                existing_words_map = {(w.word_native.strip().lower(), w.translation_fr.strip().lower()): w for w in db.query(Word).all()}

                words_to_add = []
                pronunciations_to_add = []
                validations_to_add = []

                for item in manifest_data:
                    native = item.get("word_native") or item.get("wordNative")
                    trans_fr = item.get("translation_fr") or item.get("translationFr")
                    if not native or not trans_fr:
                        continue

                    key = (native.strip().lower(), trans_fr.strip().lower())
                    audio_url = item.get("audio_url") or item.get("audioUrl")
                    is_val = bool(item.get("is_validated", True) if audio_url else False)

                    word_obj = existing_words_map.get(key)
                    if not word_obj:
                        word_obj = Word(
                            language_id="LAR",
                            word_native=native,
                            phonetic=item.get("phonetic"),
                            translation_fr=trans_fr,
                            translation_en=item.get("translation_en") or item.get("translationEn", ""),
                            category=item.get("category", "Vocabulaire Général"),
                            difficulty_level=item.get("difficulty_level") or item.get("difficultyLevel", 1),
                            cultural_note=item.get("cultural_note") or item.get("culturalNote", ""),
                            audio_url=audio_url,
                            speaker_name=item.get("speaker_name") or item.get("speakerName") or "Comité des Sages & Linguistes Lari (Pool / Brazzaville)",
                            is_validated=is_val
                        )
                        db.add(word_obj)
                        db.flush()
                        existing_words_map[key] = word_obj
                    else:
                        # Update audio_url and validation status if missing or outdated
                        if audio_url and word_obj.audio_url != audio_url:
                            word_obj.audio_url = audio_url
                            word_obj.is_validated = is_val

                    # Ensure Pronunciation record exists
                    if audio_url:
                        existing_pron = db.query(Pronunciation).filter(Pronunciation.word_id == word_obj.id).first()
                        if not existing_pron:
                            pron = Pronunciation(
                                word_id=word_obj.id,
                                audio_url=audio_url,
                                speaker_name=word_obj.speaker_name,
                                speaker_type="NATIVE_ELDER",
                                is_primary=True
                            )
                            pronunciations_to_add.append(pron)

                    # Ensure LinguisticValidation record exists
                    if is_val and validator_user:
                        existing_val = db.query(LinguisticValidation).filter(
                            LinguisticValidation.entity_type == "WORD",
                            LinguisticValidation.entity_id == word_obj.id
                        ).first()
                        if not existing_val:
                            val = LinguisticValidation(
                                entity_type="WORD",
                                entity_id=word_obj.id,
                                validator_id=validator_user.id,
                                status="APPROVED",
                                comments="Prononciation authentique et conformité lexicale MBUTA validées."
                            )
                            validations_to_add.append(val)

                if pronunciations_to_add:
                    db.add_all(pronunciations_to_add)
                if validations_to_add:
                    db.add_all(validations_to_add)

                db.commit()
                print(f"[SEED] OK - {db.query(Word).count()} mots Lari, {db.query(Pronunciation).count()} prononciations et {db.query(LinguisticValidation).count()} validations enregistrees.")

        # 5. Seed Cultural Stories (Nzolo ya Bakulu)
        if db.query(CulturalStory).count() == 0:
            stories_data = [
                {
                    "type": "STORY",
                    "title_native": "Nkosi na Mbolo mu zamba",
                    "title_fr": "Le Lion et le Chien dans la forêt",
                    "content_native": "Mu bampangi ya nkama, Nkosi ba fukisina mbele mosi. Mbolo ta wa ku zola mu baka ndandu mu zamba...",
                    "content_fr": "Il y a bien longtemps, le Lion et le Chien vivaient en harmonie. Le Lion montra au Chien comment écouter le chant des arbres...",
                    "audio_url": "/audio/stories/nkosi_na_mbolo.wav",
                    "elder_speaker_name": "Nkulu Mamma Pauline (Brazzaville)",
                    "duration_seconds": 145,
                    "moral_lesson": "La force sans l'écoute ne mène à rien. Respecte toujours tes amis et les anciens.",
                    "category": "Contes d'Animaux",
                    "is_validated": True
                },
                {
                    "type": "PROVERB",
                    "title_native": "Kongo dia Ntotila",
                    "title_fr": "Les sagesses du royaume ancestral",
                    "content_native": "Mwana lari ya moko mosi ka lendi baka nza ko.",
                    "content_fr": "Une seule main ne peut pas porter le monde à elle seule. (L'union fait la force).",
                    "audio_url": "/audio/stories/kongo_dia_ntotila.wav",
                    "elder_speaker_name": "Nkulu Papa Jean-Baptiste",
                    "duration_seconds": 60,
                    "moral_lesson": "Travailler ensemble en famille permet d'accomplir ce qu'aucun individu ne peut faire seul.",
                    "category": "Proverbes & Sagesses",
                    "is_validated": True
                },
                {
                    "type": "SONG",
                    "title_native": "Nkimba ya Mwana",
                    "title_fr": "Berceuse du soir sous le Baobab",
                    "content_native": "Lala mwana lala, mama ke kwiza na madia ma zole...",
                    "content_fr": "Dors petit enfant dors, maman revient du champ avec des fruits doux...",
                    "audio_url": "/audio/stories/nkimba_ya_mwana.wav",
                    "elder_speaker_name": "Grand-mère Clarisse",
                    "duration_seconds": 90,
                    "moral_lesson": "Le repos et la douceur de la famille apportent la sérénité.",
                    "category": "Chants & Berceuses",
                    "is_validated": True
                },
                {
                    "type": "STORY",
                    "title_native": "Ngo na Nsusu",
                    "title_fr": "Le Léopard et la Poule",
                    "content_native": "Ngo weena mfumu ku mfinda, kansi nsusu weena na mayele ma nene mu kuka nzo...",
                    "content_fr": "Le léopard était le seigneur de la brousse, mais la poule par sa ruse et sa vivacité d'esprit sut protéger ses poussins...",
                    "audio_url": "/audio/stories/ngo_na_nsusu.wav",
                    "elder_speaker_name": "Nkulu Papa Jean-Baptiste (Pointe-Noire)",
                    "duration_seconds": 160,
                    "moral_lesson": "L'intelligence et la prudence l'emportent toujours sur la force brute.",
                    "category": "Contes d'Animaux",
                    "is_validated": True
                },
                {
                    "type": "PROVERB",
                    "title_native": "Luzolo lwa Koko",
                    "title_fr": "La sagesse de Koko le perroquet sage",
                    "content_native": "Koko wate: Lusadisa lwa mpangi yaku yina bumbote bwa ntima.",
                    "content_fr": "Koko disait : Aider son frère est la plus belle preuve de générosité du cœur.",
                    "audio_url": "/audio/stories/luzolo_lwa_koko.wav",
                    "elder_speaker_name": "Mamma Pauline (Brazzaville)",
                    "duration_seconds": 75,
                    "moral_lesson": "Le partage et la bienveillance sont les plus grands trésors d'une communauté.",
                    "category": "Proverbes & Sagesses",
                    "is_validated": True
                }
            ]
            for s in stories_data:
                story_obj = CulturalStory(language_id="LAR", **s)
                db.add(story_obj)
            db.commit()
            print(f"[SEED] OK - {len(stories_data)} contes et proverbes patrimoniaux inseres.")

        # 6. Seed Subscription Plans (Idempotent)
        from ..models.subscription import SubscriptionPlan
        expected_plans = [
            {
                "id": "plan_free",
                "name": "Découverte (Gratuit)",
                "tier": "FREE",
                "billing_period": "MONTHLY",
                "price_xaf": 0,
                "price_eur": 0.0,
                "max_children": 1,
                "description": "Pour s'initier aux premiers mots de Lari."
            },
            {
                "id": "plan_family_monthly",
                "name": "Famille Mwana Lari (Mensuel)",
                "tier": "FAMILY",
                "billing_period": "MONTHLY",
                "price_xaf": 1500,
                "price_eur": 2.49,
                "max_children": 3,
                "description": "Accès complet aux 529 mots, contes et jeux pour la famille."
            },
            {
                "id": "plan_family_annual",
                "name": "Famille Mwana Lari (Annuel)",
                "tier": "FAMILY",
                "billing_period": "ANNUAL",
                "price_xaf": 15000,
                "price_eur": 24.99,
                "max_children": 3,
                "description": "Accès annuel complet avec 2 mois offerts."
            },
            {
                "id": "plan_clan_monthly",
                "name": "Grand Clan & Diaspora (Mensuel)",
                "tier": "CLAN_DIASPORA",
                "billing_period": "MONTHLY",
                "price_xaf": 2500,
                "price_eur": 4.99,
                "max_children": 10,
                "description": "Pour les grandes familles et la diaspora avec profils illimités."
            },
            {
                "id": "plan_clan_annual",
                "name": "Grand Clan & Diaspora (Annuel)",
                "tier": "CLAN_DIASPORA",
                "billing_period": "ANNUAL",
                "price_xaf": 25000,
                "price_eur": 49.99,
                "max_children": 10,
                "description": "Accès annuel grand clan avec 2 mois offerts et suivi personnalisé."
            }
        ]
        
        for p_data in expected_plans:
            existing_p = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == p_data["id"]).first()
            if not existing_p:
                db.add(SubscriptionPlan(**p_data))
            else:
                existing_p.name = p_data["name"]
                existing_p.tier = p_data["tier"]
                existing_p.billing_period = p_data["billing_period"]
                existing_p.price_xaf = p_data["price_xaf"]
                existing_p.price_eur = p_data["price_eur"]
                existing_p.max_children = p_data["max_children"]
                existing_p.description = p_data["description"]
        db.commit()
        print("[SEED] OK - Forfaits d'abonnement Mobile Money synchronises en base (dont plan_clan_annual).")

        print("[SEED] Base de donnees Mwana Lari initialisee et peuplee avec succes !")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

