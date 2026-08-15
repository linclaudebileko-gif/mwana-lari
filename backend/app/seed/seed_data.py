from sqlalchemy.orm import Session
from ..database import engine, SessionLocal, Base
from ..models.language import Language
from ..models.user import User
from ..models.child import Child
from ..models.word import Word, Pronunciation
from ..models.cultural_story import CulturalStory
from ..auth.security import get_password_hash

def seed_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
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
            admin_user = User(
                email="admin@mwanalari.cg",
                password_hash=get_password_hash("MwanaLari2026!"),
                full_name="Professeur Massamba (Linguiste en Chef)",
                role="ADMIN",
                country_code="CG"
            )
            linguist_user = User(
                email="linguiste@mwanalari.cg",
                password_hash=get_password_hash("MwanaLari2026!"),
                full_name="Mamma Pauline (Comite Linguistique Lari)",
                role="LINGUIST",
                country_code="CG"
            )
            parent_user = User(
                email="parent@mwanalari.cg",
                password_hash=get_password_hash("MwanaLari2026!"),
                full_name="Mavoungou Jean (Parent)",
                role="PARENT",
                country_code="CG"
            )
            teacher_user = User(
                email="enseignant@mwanalari.cg",
                password_hash=get_password_hash("MwanaLari2026!"),
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

        # 4. Seed Lari Vocabulary Words
        if db.query(Word).count() == 0:
            import json
            import os
            
            json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "lexicon", "dictionnaire_lari_francais.json"))
            words_data = []
            
            if os.path.exists(json_path):
                with open(json_path, "r", encoding="utf-8") as f:
                    raw_words = json.load(f)
                    for item in raw_words:
                        audio_filename = item["wordNative"].lower().replace("'", "").replace("ù", "u").replace("á", "a").replace("-", "") + ".wav"
                        words_data.append({
                            "word_native": item.get("wordNative"),
                            "phonetic": item.get("phonetic"),
                            "translation_fr": item.get("translationFr"),
                            "translation_en": item.get("translationEn", ""),
                            "category": item.get("category", "Général"),
                            "difficulty_level": item.get("difficultyLevel", 1),
                            "cultural_note": item.get("culturalNote", ""),
                            "example_sentence_native": item.get("exampleSentenceNative", ""),
                            "example_sentence_fr": item.get("exampleSentenceFr", ""),
                            "audio_url": f"/audio/words/{audio_filename}",
                            "speaker_name": "Mamma Pauline (Brazzaville)"
                        })
            
            if not words_data:
                words_data = [
                    {
                        "word_native": "Mbote",
                        "phonetic": "[m̀-bó-tè]",
                        "translation_fr": "Bonjour / Salut / Paix",
                        "translation_en": "Hello / Peace",
                        "category": "Salutations",
                        "difficulty_level": 1,
                        "cultural_note": "Formule de politesse fondamentale prononcée en inclinant légèrement la tête.",
                        "example_sentence_native": "Mbote na beno babonso !",
                        "example_sentence_fr": "Bonjour à vous tous !",
                        "audio_url": "/audio/words/mbote.wav",
                        "speaker_name": "Mamma Pauline (Brazzaville)",
                    }
                ]
            
            for w in words_data:
                word_obj = Word(
                    language_id="LAR",
                    is_validated=True,
                    **w
                )
                db.add(word_obj)
            db.commit()
            print(f"[SEED] OK - {len(words_data)} mots Lari inseres avec succes depuis la base lexicale.")

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

        print("[SEED] Base de donnees Mwana Lari initialisee et peuplee avec succes !")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
