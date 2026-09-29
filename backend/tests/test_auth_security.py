import sys
import os
import time
from datetime import datetime, timedelta
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.seed.seed_data import seed_database
from app.auth.security import create_access_token, decode_access_token

seed_database()
client = TestClient(app)

def test_secure_cookies_on_login():
    """Vérifie que les cookies posés lors du login sont HttpOnly, SameSite et avec les bons chemins."""
    res = client.post("/api/v1/auth/demo-login", json={"role": "parent"})
    assert res.status_code == 200
    cookies = res.cookies
    assert "mwana_access_token" in cookies
    assert "mwana_refresh_token" in cookies
    assert "mwana_csrf_token" in cookies

    # Inspecter les entêtes Set-Cookie
    set_cookie_headers = res.headers.get_list("set-cookie")
    access_cookie_header = next((c for c in set_cookie_headers if 'mwana_access_token' in c), None)
    refresh_cookie_header = next((c for c in set_cookie_headers if 'mwana_refresh_token' in c), None)
    csrf_cookie_header = next((c for c in set_cookie_headers if 'mwana_csrf_token' in c), None)

    assert access_cookie_header is not None
    assert "httponly" in access_cookie_header.lower()
    assert "samesite=lax" in access_cookie_header.lower()

    assert refresh_cookie_header is not None
    assert "httponly" in refresh_cookie_header.lower()
    assert "path=/api/v1/auth" in refresh_cookie_header.lower()

    assert csrf_cookie_header is not None
    # CSRF cookie ne doit PAS être httponly car le JS du frontend doit le lire pour le header X-CSRF-Token
    assert "httponly" not in csrf_cookie_header.lower()
    print("PASS: Cookies sécurisés posés (HttpOnly, SameSite, chemins stricts)")

def test_access_token_short_lifetime_and_expiration():
    """Vérifie le rejet d'un access token expiré."""
    # Créer un jeton expiré (il y a 10 secondes)
    expired_token = create_access_token(
        data={"sub": "test_user", "email": "test@mwanalari.cg", "role": "PARENT", "ver": 1},
        expires_delta=timedelta(seconds=-10)
    )
    assert decode_access_token(expired_token) is None

    # Requête avec jeton expiré -> 401
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    print("PASS: Rejet des jetons d'accès expirés (durée courte)")

def test_refresh_token_rotation_and_revocation():
    """Vérifie la rotation du refresh token et l'impossibilité de réutiliser un ancien token."""
    login_res = client.post("/api/v1/auth/demo-login", json={"role": "teacher"})
    assert login_res.status_code == 200
    first_refresh = login_res.cookies.get("mwana_refresh_token")
    csrf_token = login_res.cookies.get("mwana_csrf_token")
    assert first_refresh is not None

    # Utiliser le refresh token pour obtenir une nouvelle session
    refresh_client = TestClient(app)
    refresh_client.cookies.set("mwana_refresh_token", first_refresh)
    refresh_res = refresh_client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 200
    second_refresh = refresh_res.cookies.get("mwana_refresh_token")
    assert second_refresh is not None
    assert second_refresh != first_refresh
    print("PASS: Rotation du Refresh Token effectuée avec succès (nouveau token généré)")

    # Test de tentative de REJEU / VOL : réutiliser first_refresh doit échouer et invalider la session
    reuse_client = TestClient(app)
    reuse_client.cookies.set("mwana_refresh_token", first_refresh)
    reuse_res = reuse_client.post("/api/v1/auth/refresh")
    assert reuse_res.status_code == 401
    assert "rejeu" in reuse_res.json()["detail"].lower() or "suspecte" in reuse_res.json()["detail"].lower()
    print("PASS: Détection de rejeu / vol de session : alerte et révocation totale immédiate")

    # Vérifier que le second token a également été invalidé suite à la compromission
    compromised_check = TestClient(app)
    compromised_check.cookies.set("mwana_refresh_token", second_refresh)
    res_comp = compromised_check.post("/api/v1/auth/refresh")
    assert res_comp.status_code == 401
    print("PASS: Famille de tokens compromise révoquée avec succès")

def test_csrf_protection_on_cookie_auth():
    """Vérifie le blocage des attaques CSRF sur les requêtes authentifiées par cookies."""
    login_res = client.post("/api/v1/auth/demo-login", json={"role": "admin"})
    access_cookie = login_res.cookies.get("mwana_access_token")
    csrf_cookie = login_res.cookies.get("mwana_csrf_token")

    auth_client = TestClient(app)
    auth_client.cookies.set("mwana_access_token", access_cookie)

    # 1. Attaque CSRF : Requête POST avec cookie mais SANS header X-CSRF-Token
    malicious_res = auth_client.post("/api/v1/parents/children", json={
        "first_name": "HackChild",
        "age_group": "6-8"
    })
    assert malicious_res.status_code == 403
    assert "csrf" in malicious_res.json()["detail"].lower()
    print("PASS: Requête sans jeton CSRF bloquée avec HTTP 403 Forbidden")

    # 2. Requête avec mauvais jeton CSRF -> 403
    bad_csrf_res = auth_client.post(
        "/api/v1/parents/children",
        headers={"X-CSRF-Token": "bad_token_12345"},
        json={"first_name": "HackChild", "age_group": "6-8"}
    )
    assert bad_csrf_res.status_code == 403
    print("PASS: Requête avec mauvais jeton CSRF rejetée avec HTTP 403 Forbidden")

    # 3. Requête légitime avec bon jeton CSRF -> 200/201
    auth_client.cookies.set("mwana_csrf_token", csrf_cookie)
    legit_res = auth_client.post(
        "/api/v1/parents/children",
        headers={"X-CSRF-Token": csrf_cookie},
        json={"first_name": "Merveille", "age_group": "6-8"}
    )
    assert legit_res.status_code in (200, 201)
    print("PASS: Requête légitime avec jeton CSRF valide acceptée")

def test_logout_and_session_revocation():
    """Vérifie la déconnexion et révocation en DB."""
    login_res = client.post("/api/v1/auth/demo-login", json={"role": "parent"})
    access_cookie = login_res.cookies.get("mwana_access_token")
    refresh_cookie = login_res.cookies.get("mwana_refresh_token")

    session_client = TestClient(app)
    session_client.cookies.set("mwana_access_token", access_cookie)
    session_client.cookies.set("mwana_refresh_token", refresh_cookie)

    # Déconnexion
    logout_res = session_client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

    # Tentative d'utiliser le refresh token révoqué
    refresh_after_logout = session_client.post("/api/v1/auth/refresh")
    assert refresh_after_logout.status_code == 401
    print("PASS: Déconnexion réussie et révocation du Refresh Token validée")

def test_global_logout_and_token_version():
    """Vérifie que logout-all invalide immédiatement les access tokens existants."""
    login_res = client.post("/api/v1/auth/demo-login", json={"role": "parent"})
    access_token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Le token fonctionne
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200

    # Déconnexion globale de tous les appareils
    logout_all_res = client.post("/api/v1/auth/logout-all", headers=headers)
    assert logout_all_res.status_code == 200

    # Le même token d'accès doit maintenant être IMMÉDIATEMENT rejeté car token_version a changé
    me_after = client.get("/api/v1/auth/me", headers=headers)
    assert me_after.status_code == 401
    print("PASS: Déconnexion globale invalide instantanément tous les jetons actifs (token_version)")

def test_change_password_invalidates_sessions():
    """Vérifie que la modification de mot de passe invalide les anciennes sessions."""
    # 1. Enregistrer un utilisateur de test
    test_email = f"pwd_test_{int(time.time())}@mwanalari.cg"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": "InitialPassword123!",
        "full_name": "Test Pwd User",
        "role": "PARENT"
    })
    assert reg_res.status_code == 201
    old_access_token = reg_res.json()["access_token"]
    csrf_token = reg_res.cookies.get("mwana_csrf_token")

    # 2. Changer le mot de passe
    change_res = client.post(
        "/api/v1/auth/change-password",
        headers={
            "Authorization": f"Bearer {old_access_token}",
            "X-CSRF-Token": csrf_token or ""
        },
        json={
            "old_password": "InitialPassword123!",
            "new_password": "NewSecurePassword456!"
        }
    )
    assert change_res.status_code == 200

    # 3. L'ancien token d'accès doit être immédiatement rejeté (token_version incrémenté)
    old_token_check = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {old_access_token}"})
    assert old_token_check.status_code == 401
    print("PASS: Changement de mot de passe révoque instantanément les anciennes sessions")

def test_cors_strict_origins():
    """Vérifie que CORS ne renvoie pas d'en-têtes permissifs pour une origine inconnue."""
    res = client.options(
        "/api/v1/words/search",
        headers={
            "Origin": "https://malicious-site.com",
            "Access-Control-Request-Method": "GET"
        }
    )
    # L'origine non autorisée ne doit pas figurer dans Access-Control-Allow-Origin
    allow_origin = res.headers.get("access-control-allow-origin")
    assert allow_origin != "https://malicious-site.com"
    assert allow_origin != "*"
    print("PASS: CORS restreint strictement aux origines autorisées")

if __name__ == "__main__":
    print("==================================================")
    print("  MWANA LARI CYBERSECURITY HARDENING TEST SUITE   ")
    print("==================================================")
    test_secure_cookies_on_login()
    test_access_token_short_lifetime_and_expiration()
    test_refresh_token_rotation_and_revocation()
    test_csrf_protection_on_cookie_auth()
    test_logout_and_session_revocation()
    test_global_logout_and_token_version()
    test_change_password_invalidates_sessions()
    test_cors_strict_origins()
    print("==================================================")
    print("  ALL CYBERSECURITY TESTS PASSED (100% SUCCESS) ! ")
    print("==================================================")

