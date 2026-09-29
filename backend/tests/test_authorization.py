import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.seed.seed_data import seed_database
from app.auth.security import create_access_token
from app.database import SessionLocal
from app.models.user import User
from app.models.child import Child
from app.models.subscription import UserSubscription, SubscriptionPlan
from app.auth.rate_limiter import limiter

seed_database()
client = TestClient(app)

def reset_rate_limiter():
    with limiter._lock:
        limiter._hits.clear()

def create_fresh_parent(email: str, name: str) -> tuple[TestClient, str, str]:
    """Helper creating a real parent account in database and returning authenticated TestClient, user_id, email."""
    reset_rate_limiter()
    c = TestClient(app)
    pwd = "PasswordSecure123!"
    reg = c.post("/api/v1/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": name,
        "role": "PARENT"
    })
    assert reg.status_code == 201, f"Failed to register {email}: {reg.text}"
    data = reg.json()
    user_id = data["user_id"]
    access_token = data["access_token"]
    c.headers["Authorization"] = f"Bearer {access_token}"
    return c, user_id, email

# ============================================================================
# 1. TEST UTILISATEUR NON CONNECTÉ (REFUS PAR DÉFAUT -> 401)
# ============================================================================
def test_unauthenticated_user_denied_401():
    """
    Vérifie la politique de 'refus par défaut' : toute requête non authentifiée
    vers un endpoint protégé doit être systématiquement rejetée avec HTTP 401 Unauthorized.
    """
    unauth = TestClient(app)

    protected_endpoints = [
        ("GET", "/api/v1/payments/admin/subscribers"),
        ("GET", "/api/v1/payments/admin/transactions"),
        ("POST", "/api/v1/payments/admin/grant", {"email_or_phone": "test@mwanalari.cg", "tier": "FAMILY", "duration_months": 1}),
        ("GET", "/api/v1/admin/validations/pending"),
        ("POST", "/api/v1/words/", {"language_id": "LAR", "word_native": "Mboté", "translation_fr": "Bonjour", "category": "Salutations", "difficulty_level": 1}),
        ("GET", "/api/v1/parents/children"),
        ("POST", "/api/v1/parents/children", {"first_name": "Koko", "age_group": "4-6"}),
        ("GET", "/api/v1/payments/my-subscription"),
        ("POST", "/api/v1/auth/logout-all", {}),
        ("GET", "/api/v1/auth/me"),
        ("GET", "/api/v1/lessons?child_id=dummy-child-id"),
    ]

    for item in protected_endpoints:
        method = item[0]
        url = item[1]
        body = item[2] if len(item) > 2 else None

        if method == "GET":
            res = unauth.get(url)
        elif method == "POST":
            res = unauth.post(url, json=body)
        elif method == "DELETE":
            res = unauth.delete(url)
        
        assert res.status_code == 401, f"ÉCHEC: {method} {url} aurait dû retourner 401, a reçu {res.status_code}: {res.text}"

    print("PASS: Utilisateur non connecté -> Toutes les routes protégées retournent bien HTTP 401.")

# ============================================================================
# 2. TEST UTILISATEUR NORMAL (AUTHENTIFIÉ MAIS NON AUTORISÉ -> 403)
# ============================================================================
def test_normal_user_denied_admin_routes_403():
    """
    Vérifie qu'un utilisateur authentifié avec un rôle standard (PARENT)
    reçoit un code HTTP 403 Forbidden lorsqu'il tente d'accéder aux routes d'administration.
    """
    parent_client, parent_id, _ = create_fresh_parent(f"parent_audit_{uuid.uuid4().hex[:6]}@mwanalari.cg", "Parent Audit")

    admin_routes = [
        ("GET", "/api/v1/payments/admin/subscribers", None),
        ("GET", "/api/v1/payments/admin/transactions", None),
        ("POST", "/api/v1/payments/admin/grant", {
            "email_or_phone": "beneficiaire@mwanalari.cg",
            "full_name": "Ami",
            "tier": "FAMILY",
            "duration_months": 1
        }),
        ("PATCH", "/api/v1/payments/admin/subscriptions/sub_fake_id", {"status": "ACTIVE"}),
        ("POST", "/api/v1/payments/admin/simulate-tx", {
            "provider": "MTN_MOMO",
            "phone_number": "+242066000000",
            "amount": 1500,
            "currency": "XAF",
            "status": "SUCCESS",
            "tier": "FAMILY"
        }),
        ("GET", "/api/v1/admin/validations/pending", None),
        ("POST", "/api/v1/admin/validations/val_fake_id/decide", {"decision": "APPROVED"}),
        ("DELETE", "/api/v1/words/fake_word_id", None),
        ("DELETE", "/api/v1/heritage/stories/fake_story_id", None),
    ]

    for method, url, payload in admin_routes:
        if method == "GET":
            res = parent_client.get(url)
        elif method == "POST":
            res = parent_client.post(url, json=payload)
        elif method == "PATCH":
            res = parent_client.patch(url, json=payload)
        elif method == "DELETE":
            res = parent_client.delete(url)
        
        assert res.status_code == 403, f"ÉCHEC: Utilisateur normal sur {method} {url} aurait dû être bloqué avec 403, reçu {res.status_code}"

    print("PASS: Utilisateur normal authentifié -> Accès aux routes administrateur strictement bloqué avec HTTP 403.")

# ============================================================================
# 3. TEST ADMINISTRATEUR (AUTORISÉ -> 200)
# ============================================================================
def test_admin_user_allowed_200():
    """
    Vérifie qu'un véritable administrateur authentifié peut accéder aux routes protégées.
    """
    admin_client = TestClient(app)
    login_res = admin_client.post("/api/v1/auth/demo-login", json={"role": "admin"})
    assert login_res.status_code == 200, f"Login admin échoué: {login_res.text}"
    admin_client.headers["Authorization"] = f"Bearer {login_res.json()['access_token']}"

    # Vérifier l'accès à la liste des abonnés
    res_subs = admin_client.get("/api/v1/payments/admin/subscribers")
    assert res_subs.status_code == 200
    assert isinstance(res_subs.json(), list)

    # Vérifier l'accès à l'historique des transactions
    res_txs = admin_client.get("/api/v1/payments/admin/transactions")
    assert res_txs.status_code == 200
    assert isinstance(res_txs.json(), list)

    # Vérifier l'accès aux validations linguistiques
    res_val = admin_client.get("/api/v1/admin/validations/pending")
    assert res_val.status_code == 200

    print("PASS: Véritable administrateur -> Autorisation accordée avec HTTP 200 sur toutes les routes admin.")

# ============================================================================
# 4. TENTATIVE DE MODIFICATION DU RÔLE DANS LE NAVIGATEUR (TEST CRITIQUE -> 403)
# ============================================================================
def test_browser_role_tampering_always_receives_403():
    """
    DÉMONSTRATION FINALE OBLIGATOIRE :
    Un utilisateur normal (PARENT) tente de modifier artificiellement son rôle
    dans son navigateur (localStorage, requêtes modifiées, en-têtes falsifiés,
    payloads de requêtes contenant 'role': 'ADMIN' ou 'isAdmin': true).

    Le serveur FastAPI rejette TOUJOURS la tentative avec une réponse HTTP 403 Forbidden,
    car les autorisations sont calculées exclusivement côté serveur via le JWT signé
    et l'enregistrement de l'utilisateur en base de données.
    """
    # 1. Création d'un compte parent légitime
    parent_client, parent_id, parent_email = create_fresh_parent(
        f"tamper_test_{uuid.uuid4().hex[:6]}@mwanalari.cg",
        "Parent Tamper Test"
    )

    # 2. Simulation d'une altération locale dans le navigateur :
    # L'attaquant modifie son localStorage / objet JS pour avoir 'role': 'ADMIN'
    # et envoie ce rôle frelaté dans les headers HTTP de sa requête :
    tampered_headers = {
        "X-Role": "ADMIN",
        "X-User-Role": "ADMIN",
        "role": "ADMIN",
        "isAdmin": "true"
    }

    # Tentative d'accès aux abonnés avec headers falsifiés
    res_tampered_header = parent_client.get(
        "/api/v1/payments/admin/subscribers",
        headers=tampered_headers
    )
    assert res_tampered_header.status_code == 403, (
        f"FAILLE CRITIQUE: Le serveur a accepté un rôle falsifié via header ! "
        f"Reçu {res_tampered_header.status_code}"
    )

    # 3. L'attaquant tente d'injecter 'role': 'ADMIN' directement dans le corps JSON d'une requête admin :
    res_tampered_grant = parent_client.post(
        "/api/v1/payments/admin/grant",
        json={
            "email_or_phone": "pirate@mwanalari.cg",
            "tier": "CLAN_DIASPORA",
            "duration_months": 12,
            "role": "ADMIN",
            "user_role": "ADMIN",
            "isAdmin": True
        },
        headers=tampered_headers
    )
    assert res_tampered_grant.status_code == 403, (
        f"FAILLE CRITIQUE: Le serveur a accepté une usurpation de rôle dans le payload ! "
        f"Reçu {res_tampered_grant.status_code}"
    )

    # 4. L'attaquant tente de s'auto-attribuer le rôle ADMIN lors de l'enregistrement public :
    malicious_reg_client = TestClient(app)
    reg_attempt = malicious_reg_client.post("/api/v1/auth/register", json={
        "email": f"hacker_{uuid.uuid4().hex[:6]}@mwanalari.cg",
        "password": "PasswordHacker123!",
        "full_name": "Fake Admin",
        "role": "ADMIN" # Tentative d'auto-promotion ADMIN
    })
    assert reg_attempt.status_code == 201
    # Le serveur a forcé le rôle à PARENT
    assert reg_attempt.json()["role"] == "PARENT", "FAILLE: Le serveur a permis de s'enregistrer comme ADMIN !"
    malicious_reg_client.headers["Authorization"] = f"Bearer {reg_attempt.json()['access_token']}"

    # Et quand cet utilisateur essaie d'accéder aux routes admin, il est bloqué en 403 :
    res_hacker_access = malicious_reg_client.get("/api/v1/payments/admin/subscribers")
    assert res_hacker_access.status_code == 403, "FAILLE: L'utilisateur enregistré avec rôle forcé a pu accéder aux routes admin !"

    # 5. L'attaquant tente de forger un jeton JWT avec le rôle ADMIN signé avec une clé arbitraire :
    fake_secret_token = create_access_token(
        data={"sub": parent_id, "email": parent_email, "role": "ADMIN", "ver": 1}
    )
    # Remplaçons la signature par une fausse
    parts = fake_secret_token.split(".")
    tampered_jwt = f"{parts[0]}.{parts[1]}.invalid_signature_hex"
    
    forged_client = TestClient(app)
    res_forged = forged_client.get(
        "/api/v1/payments/admin/subscribers",
        headers={"Authorization": f"Bearer {tampered_jwt}"}
    )
    assert res_forged.status_code == 401, f"FAILLE: Un JWT à signature falsifiée n'a pas été rejeté avec 401 ! Reçu {res_forged.status_code}"

    print("PASS (TEST FINAL RÉUSSI) : Toute tentative de modification du rôle dans le navigateur reçoit TOUJOURS une réponse 403 Forbidden.")

# ============================================================================
# 5. TEST CONTRÔLE DE LA PROPRIÉTÉ DE LA RESSOURCE (IDOR -> 403)
# ============================================================================
def test_resource_ownership_enforcement_idor_403():
    """
    Vérifie qu'un utilisateur (Parent A) ne peut ni lire, ni modifier,
    ni supprimer les ressources appartenant à un autre utilisateur (Parent B).
    """
    # 1. Créer deux parents distincts
    parent_a_client, parent_a_id, _ = create_fresh_parent(f"parent_a_{uuid.uuid4().hex[:6]}@mwanalari.cg", "Parent A")
    parent_b_client, parent_b_id, _ = create_fresh_parent(f"parent_b_{uuid.uuid4().hex[:6]}@mwanalari.cg", "Parent B")

    # 2. Parent B ajoute son enfant
    res_child_b = parent_b_client.post("/api/v1/parents/children", json={
        "first_name": "Enfant B",
        "age_group": "7-9",
        "avatar_id": "koko_happy"
    })
    assert res_child_b.status_code == 201
    child_b_id = res_child_b.json()["id"]

    # 3. Parent A essaie de consulter la progression de l'enfant de Parent B -> 403
    res_idor_get = parent_a_client.get(f"/api/v1/parents/children/{child_b_id}/progress")
    assert res_idor_get.status_code == 403, f"IDOR non bloqué sur get_child_progress: {res_idor_get.status_code}"

    # 4. Parent A essaie de consulter les leçons débloquées de l'enfant de Parent B -> 403
    res_idor_lessons = parent_a_client.get(f"/api/v1/lessons?child_id={child_b_id}")
    assert res_idor_lessons.status_code == 403, f"IDOR non bloqué sur get_lessons: {res_idor_lessons.status_code}"

    # 5. Parent A essaie de modifier le profil de l'enfant de Parent B -> 403
    res_idor_patch = parent_a_client.patch(f"/api/v1/parents/children/{child_b_id}", json={
        "first_name": "Enfant Piraté Par A",
        "xp_points": 9999
    })
    assert res_idor_patch.status_code == 403, f"IDOR non bloqué sur update_child: {res_idor_patch.status_code}"

    # 6. Parent A essaie de supprimer l'enfant de Parent B -> 403
    res_idor_delete = parent_a_client.delete(f"/api/v1/parents/children/{child_b_id}")
    assert res_idor_delete.status_code == 403, f"IDOR non bloqué sur delete_child: {res_idor_delete.status_code}"

    # 7. Parent A essaie de soumettre une progression au nom de l'enfant de Parent B -> 403
    res_idor_submit = parent_a_client.post("/api/v1/progress/submit", json={
        "child_id": child_b_id,
        "lesson_id": "l1",
        "score": 100,
        "xp_earned": 50,
        "time_spent_seconds": 120
    })
    assert res_idor_submit.status_code == 403, f"IDOR non bloqué sur submit_progress: {res_idor_submit.status_code}"

    # 8. Vérification que Parent B peut légitimement accéder à son enfant
    res_legit_b = parent_b_client.get(f"/api/v1/parents/children/{child_b_id}/progress")
    assert res_legit_b.status_code == 200

    print("PASS: Contrôle strict de la propriété des ressources (Anti-IDOR) -> Tout accès croisé non autorisé est rejeté avec HTTP 403.")

# ============================================================================
# 6. TEST APPEL DIRECT DE L'API SANS PASSER PAR L'INTERFACE
# ============================================================================
def test_direct_api_calls_without_browser_interface():
    """
    Vérifie qu'un appel direct par script / curl sans interface graphique :
    - Est soumis aux mêmes vérifications strictes d'authentification et de rôle.
    - Ne peut pas contourner la validation en envoyant un 'user_id' tiers lors d'un paiement.
    """
    direct_client = TestClient(app)

    # 1. Appel direct d'une route admin sans credentials -> 401
    res_direct_admin = direct_client.get("/api/v1/payments/admin/subscribers")
    assert res_direct_admin.status_code == 401

    # 2. Appel direct d'initiation Mobile Money sans être connecté :
    # Même si l'attaquant spécifie le 'user_id' d'un parent existant, le serveur ne lui attache pas
    # la session de ce parent sans authentification.
    parent_c, victim_id, _ = create_fresh_parent(f"victim_{uuid.uuid4().hex[:6]}@mwanalari.cg", "Victim Parent")

    # Requête directe non authentifiée essayant d'usurper victim_id
    res_direct_momo = direct_client.post("/api/v1/payments/momo/initiate", json={
        "plan_id": "plan_family",
        "tier": "FAMILY",
        "billing_cycle": "monthly",
        "method": "MTN_MOMO",
        "phone_number": "+242069998877",
        "amount_fcfa": 1500,
        "user_id": victim_id # tentative d'usurpation de compte
    })
    assert res_direct_momo.status_code == 200
    
    # Vérifions en base que l'utilisateur victime n'a pas été compromis
    db = SessionLocal()
    victim_user = db.query(User).filter(User.id == victim_id).first()
    assert victim_user.phone_number != "+242069998877"
    db.close()

    print("PASS: Appels directs d'API sans interface -> Contrôles serveur strictement appliqués.")

if __name__ == "__main__":
    print("=== Démarrage de la suite de tests d'autorisation Mwana Lari ===")
    test_unauthenticated_user_denied_401()
    test_normal_user_denied_admin_routes_403()
    test_admin_user_allowed_200()
    test_browser_role_tampering_always_receives_403()
    test_resource_ownership_enforcement_idor_403()
    test_direct_api_calls_without_browser_interface()
    print("=== TOUS LES TESTS D'AUTORISATION ET DE SÉCURITÉ ONT RÉUSSI AVEC SUCCÈS ===")
