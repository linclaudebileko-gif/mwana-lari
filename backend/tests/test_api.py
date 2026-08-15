import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Mwana Lari" in data["name"]
    print("PASS: Root healthcheck")

def test_auth_login():
    # 1. Login with Admin
    res_admin = client.post("/api/v1/auth/login", json={
        "email": "admin@mwanalari.cg",
        "password": "MwanaLari2026!"
    })
    assert res_admin.status_code == 200
    admin_data = res_admin.json()
    assert "access_token" in admin_data
    assert admin_data["role"] == "ADMIN"
    print("PASS: Admin login")

    # 2. Login with Parent
    res_parent = client.post("/api/v1/auth/login", json={
        "email": "parent@mwanalari.cg",
        "password": "MwanaLari2026!"
    })
    assert res_parent.status_code == 200
    parent_data = res_parent.json()
    assert parent_data["role"] == "PARENT"
    print("PASS: Parent login")
    return admin_data["access_token"], parent_data["access_token"]

def test_children_and_progress(parent_token):
    headers = {"Authorization": f"Bearer {parent_token}"}
    
    # 1. Get children
    res = client.get("/api/v1/parents/children", headers=headers)
    assert res.status_code == 200
    children = res.json()
    assert len(children) >= 1
    child_id = children[0]["id"]
    print(f"PASS: Parent children list (Found {len(children)} child: {children[0]['first_name']})")

    # 2. Submit progress
    res_prog = client.post("/api/v1/progress/submit", json={
        "child_id": child_id,
        "lesson_id": "l1",
        "score": 100,
        "xp_earned": 20
    })
    assert res_prog.status_code == 201
    print("PASS: Child progress submitted (+20 XP)")

    # 3. Get child stats
    res_stats = client.get(f"/api/v1/parents/children/{child_id}/progress", headers=headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["completed_lessons_count"] >= 1
    print(f"PASS: Child progress stats: Level {stats['level']} | XP {stats['xp_points']}")

def test_words_dictionary():
    # 1. Search Mbote
    res = client.get("/api/v1/words/search?q=Mbote")
    assert res.status_code == 200
    words = res.json()
    assert len(words) >= 1
    assert words[0]["word_native"] == "Mbote"
    print(f"PASS: Word search (found '{words[0]['word_native']}' -> '{words[0]['translation_fr']}')")

    # 2. Category filter
    res_cat = client.get("/api/v1/words/search?category=Famille")
    assert res_cat.status_code == 200
    fam_words = res_cat.json()
    assert len(fam_words) >= 2
    print(f"PASS: Category filter 'Famille' returned {len(fam_words)} words")

def test_heritage_stories(parent_token, admin_token):
    # 1. Get stories
    res = client.get("/api/v1/heritage/stories")
    assert res.status_code == 200
    stories = res.json()
    assert len(stories) >= 3
    print(f"PASS: Cultural stories list ({len(stories)} stories)")

    # 2. Parent contributes a story -> queued for validation
    res_contrib = client.post(
        "/api/v1/heritage/contribute",
        headers={"Authorization": f"Bearer {parent_token}"},
        json={
            "type": "PROVERB",
            "title_native": "Moko mosi",
            "title_fr": "Une seule main",
            "content_native": "Mwana wa mosi ka lendi baka nza ko.",
            "content_fr": "Une seule main ne peut embrasser le monde.",
            "elder_speaker_name": "Papa Jean-Baptiste",
            "moral_lesson": "Solidarite et entraide"
        }
    )
    assert res_contrib.status_code == 201
    story_data = res_contrib.json()
    assert story_data["is_validated"] == False
    print("PASS: Elder contribution queued into linguistic validation pipeline")

    # 3. Admin checks pending validations
    res_val = client.get(
        "/api/v1/admin/validations/pending",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_val.status_code == 200
    pending_list = res_val.json()
    assert len(pending_list) >= 1
    validation_id = pending_list[0]["id"]
    print(f"PASS: Linguistic validation queue (Found {len(pending_list)} pending item)")

    # 4. Admin approves validation
    res_decide = client.post(
        f"/api/v1/admin/validations/{validation_id}/decide",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "decision": "APPROVED",
            "comments": "Proverbe authentique validé par le comité linguistique Lari."
        }
    )
    assert res_decide.status_code == 200
    assert res_decide.json()["status"] == "APPROVED"
    print("PASS: Linguistic validation approved by Linguist Admin")

if __name__ == "__main__":
    print("==================================================")
    print("  MWANA LARI FASTAPI BACKEND AUTOMATED TEST SUITE ")
    print("==================================================")
    test_root_endpoint()
    admin_token, parent_token = test_auth_login()
    test_children_and_progress(parent_token)
    test_words_dictionary()
    test_heritage_stories(parent_token, admin_token)
    print("==================================================")
    print("  ALL 11 BACKEND API TESTS PASSED SUCCESSFULLY !  ")
    print("==================================================")
