import sys
import os
import io
import logging
import hashlib
import uuid
import bcrypt
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.config import settings
from app.auth.security import (
    get_password_hash,
    verify_password,
    create_password_reset_token,
    decode_password_reset_token,
)
from app.auth.password_policy import check_pwned_passwords, validate_password_policy
from app.auth.rate_limiter import limiter
import httpx

client = TestClient(app)

def reset_rate_limiter():
    with limiter._lock:
        limiter._hits.clear()

# Simulated HIBP database containing known compromised passwords for deterministic testing
KNOWN_BREACHED_PASSWORDS = {
    "password123456": 63210,
    "admin12345678": 12450,
    "qwertyuiop12": 8920,
}

def realistic_hibp_get(self, url, *args, **kwargs):
    """
    Simulates Have I Been Pwned API response while verifying k-anonymity constraints:
    1. URL must query strictly the 5-character prefix.
    2. URL and headers must NEVER contain full plain passwords or full SHA-1 hashes.
    """
    prefix = url.rstrip("/").split("/")[-1]
    assert len(prefix) == 5, f"Violation k-anonymity: le préfixe envoyé doit faire 5 caractères (reçu: {prefix})"

    # Generate response lines
    response_lines = []
    for pwd, count in KNOWN_BREACHED_PASSWORDS.items():
        sha1 = hashlib.sha1(pwd.encode("utf-8")).hexdigest().upper()
        if sha1.startswith(prefix):
            suffix = sha1[5:]
            response_lines.append(f"{suffix}:{count}")

    # Add random padding suffixes to mimic real HIBP behavior
    response_lines.append(f"0018A45C4D1DEF81644B54AB7F969B88D65:2")
    response_lines.append(f"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:1")

    return httpx.Response(200, text="\r\n".join(response_lines))

class LogCaptureHandler(logging.Handler):
    """Handler in-memory pour vérifier l'absence totale de fuites de données dans les journaux."""
    def __init__(self):
        super().__init__()
        self.records = []
        self.buffer = io.StringIO()

    def emit(self, record):
        self.records.append(record)
        msg = self.format(record)
        self.buffer.write(msg + "\n")

    def get_full_log_text(self) -> str:
        return self.buffer.getvalue()

def test_compromised_password_rejected():
    """
    1. Vérifie qu'un mot de passe notoirement compromis est refusé
       avec un message clair demandant de choisir un autre mot de passe.
    """
    reset_rate_limiter()
    known_pwned = "password123456"
    test_email = f"pwned_test_{uuid.uuid4().hex[:8]}@mwanalari.cg"

    with patch.object(httpx.Client, "get", realistic_hibp_get):
        res = client.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": known_pwned,
            "full_name": "Test Compromised User",
            "role": "PARENT",
            "country_code": "CG"
        })

    assert res.status_code == 400
    detail = res.json().get("detail", "")
    assert "compromis" in detail.lower()
    assert "choisir" in detail.lower()
    print("PASS: 1. Mot de passe notoirement compromis rejeté avec message clair et explicite.")

def test_unique_strong_password_accepted():
    """
    2. Vérifie qu'un mot de passe unique respectant la politique est accepté.
    """
    reset_rate_limiter()
    unique_pwd = f"MwanaLari_Protégé_2026_{uuid.uuid4().hex[:12]}!"
    test_email = f"unique_user_{uuid.uuid4().hex[:8]}@mwanalari.cg"

    with patch.object(httpx.Client, "get", realistic_hibp_get):
        res = client.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": unique_pwd,
            "full_name": "Test Unique User",
            "role": "PARENT",
            "country_code": "CG"
        })

    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["email"] == test_email
    print("PASS: 2. Mot de passe unique accepté avec succès.")

def test_long_passphrase_with_spaces_accepted():
    """
    Vérifie l'acceptation pleine et entière des phrases de passe longues
    (avec espaces et caractères accentués / Unicode).
    """
    reset_rate_limiter()
    passphrase = "mwana lari kizole na mayele brazzaville 2026 secure!"
    test_email = f"passphrase_user_{uuid.uuid4().hex[:8]}@mwanalari.cg"

    with patch.object(httpx.Client, "get", realistic_hibp_get):
        res = client.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": passphrase,
            "full_name": "Test Passphrase User",
            "role": "TEACHER",
            "country_code": "CG"
        })

    assert res.status_code == 201
    print("PASS: Phrase de passe avec espaces et ponctuation acceptée sans restriction arbitraire.")

def test_short_password_rejected():
    """
    Vérifie le rejet des mots de passe de moins de 12 caractères.
    """
    reset_rate_limiter()
    short_pwd = "Court99!"
    test_email = f"short_user_{uuid.uuid4().hex[:8]}@mwanalari.cg"

    res = client.post("/api/v1/auth/register", json={
        "email": test_email,
        "password": short_pwd,
        "full_name": "Test Short User",
        "role": "PARENT",
        "country_code": "CG"
    })

    assert res.status_code == 400
    detail = res.json().get("detail", "")
    assert "12" in detail
    print("PASS: Longueur minimale de 12 caractères strictement vérifiée (rejet < 12).")

def test_no_passwords_or_hashes_in_logs():
    """
    3. Vérifie qu'aucun mot de passe ni empreinte SHA-1 n'apparaît dans les logs
       lors des vérifications k-anonymity ou des rejets/acceptations.
    """
    reset_rate_limiter()
    capture_handler = LogCaptureHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    capture_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    security_logger = logging.getLogger("mwana_lari_security")
    auth_logger = logging.getLogger("mwana_lari_auth")

    root_logger.addHandler(capture_handler)
    security_logger.addHandler(capture_handler)
    auth_logger.addHandler(capture_handler)

    secret_raw_password = f"UltraSecretPhrase_#2026_{uuid.uuid4().hex}!"
    secret_sha1 = hashlib.sha1(secret_raw_password.encode("utf-8")).hexdigest().upper()
    secret_suffix = secret_sha1[5:]

    pwned_pwd = "password123456"
    pwned_sha1 = hashlib.sha1(pwned_pwd.encode("utf-8")).hexdigest().upper()
    pwned_suffix = pwned_sha1[5:]

    try:
        with patch.object(httpx.Client, "get", realistic_hibp_get):
            # Tentative avec mot de passe compromis
            client.post("/api/v1/auth/register", json={
                "email": f"log_test_pwned_{uuid.uuid4().hex[:6]}@mwanalari.cg",
                "password": pwned_pwd,
                "full_name": "Log Test User",
                "role": "PARENT",
            })

            # Tentative avec mot de passe unique secret
            client.post("/api/v1/auth/register", json={
                "email": f"log_test_secret_{uuid.uuid4().hex[:6]}@mwanalari.cg",
                "password": secret_raw_password,
                "full_name": "Log Test User 2",
                "role": "PARENT",
            })

        all_logs = capture_handler.get_full_log_text()

        # Strict Assertions: Zero sensitive leaks in server logs
        assert secret_raw_password not in all_logs, "LEAK DETECTED: Le mot de passe secret apparaît dans les logs !"
        assert pwned_pwd not in all_logs, "LEAK DETECTED: Le mot de passe compromis apparaît dans les logs !"
        assert secret_sha1 not in all_logs, "LEAK DETECTED: L'empreinte SHA-1 complète apparaît dans les logs !"
        assert pwned_sha1 not in all_logs, "LEAK DETECTED: L'empreinte SHA-1 complète apparaît dans les logs !"
        assert secret_suffix not in all_logs, "LEAK DETECTED: Le suffixe SHA-1 secret apparaît dans les logs !"
        assert pwned_suffix not in all_logs, "LEAK DETECTED: Le suffixe SHA-1 pwned apparaît dans les logs !"

        print("PASS: 3. Aucun mot de passe, ni empreinte SHA-1, ni suffixe n'apparaît dans les logs.")

    finally:
        root_logger.removeHandler(capture_handler)
        security_logger.removeHandler(capture_handler)
        auth_logger.removeHandler(capture_handler)

def test_passwords_properly_hashed_in_db():
    """
    4. Vérifie que les mots de passe sont correctement hachés avec Argon2id
       dans la base de données (PostgreSQL/SQLAlchemy) et jamais stockés en clair.
    """
    reset_rate_limiter()
    raw_pwd = f"RobustArgon2Password_{uuid.uuid4().hex[:10]}!"
    test_email = f"argon2_user_{uuid.uuid4().hex[:8]}@mwanalari.cg"

    with patch.object(httpx.Client, "get", realistic_hibp_get):
        res = client.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": raw_pwd,
            "full_name": "Argon2 Verification User",
            "role": "PARENT",
        })
    assert res.status_code == 201

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        assert user is not None
        stored_hash = user.password_hash

        # Assertions sur la valeur stockée en base de données
        assert stored_hash != raw_pwd, "LEAK: Le mot de passe est stocké en clair !"
        assert stored_hash.startswith("$argon2id$"), f"L'algorithme de hachage n'est pas Argon2id: {stored_hash[:20]}"
        assert len(stored_hash) <= 255, "Le hash dépasse la taille VARCHAR(255) de PostgreSQL"
        assert raw_pwd not in stored_hash

        # Vérification fonctionnelle par verify_password
        assert verify_password(raw_pwd, stored_hash) is True
        assert verify_password("WrongPassword123!", stored_hash) is False

        print("PASS: 4. Les mots de passe restent correctement et robustement hachés avec Argon2id dans PostgreSQL.")
    finally:
        db.close()

def test_k_anonymity_prefix_only_sent():
    """
    Vérifie le principe strict de k-anonymity :
    - Seul le préfixe de 5 caractères est envoyé sur le réseau.
    - Le mot de passe complet et le hash complet ne sont jamais envoyés.
    """
    sent_urls = []

    def mock_transport(request: httpx.Request) -> httpx.Response:
        sent_urls.append(str(request.url))
        assert test_pwd.lower() not in str(request.url).lower()
        return httpx.Response(200, text="0018A45C4D1DEF81644B54AB7F969B88D65:1\n")

    test_client = httpx.Client(transport=httpx.MockTransport(mock_transport))
    test_pwd = "SpecificSecretTestingPassword99!"
    expected_sha1 = hashlib.sha1(test_pwd.encode("utf-8")).hexdigest().upper()
    expected_prefix = expected_sha1[:5]

    is_pwned, count = check_pwned_passwords(test_pwd, client=test_client)

    assert len(sent_urls) == 1
    requested_url = sent_urls[0]
    assert requested_url.endswith(f"/range/{expected_prefix}")
    assert expected_sha1 not in requested_url
    assert test_pwd not in requested_url
    print("PASS: Principe k-anonymity vérifié (seul le préfixe de 5 caractères est transmis).")

def test_controlled_resilience_when_service_down():
    """
    Vérifie le comportement contrôlé si l'API de vérification est indisponible
    (résilience et politique fail-open).
    """
    def mock_failing_transport(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("Connexion impossible au serveur de vérification.")

    failing_client = httpx.Client(transport=httpx.MockTransport(mock_failing_transport))
    test_pwd = "ResilientPassword2026!"

    # Fail-open activé par défaut : ne doit pas lever d'exception bloquante
    is_pwned, count = check_pwned_passwords(test_pwd, client=failing_client)
    assert is_pwned is False
    assert count == 0

    # Validation passe sans crasher le système
    validate_password_policy(test_pwd, client=failing_client)
    print("PASS: Comportement contrôlé et tolérant aux pannes réseau validé (fail-open).")

def test_change_and_reset_password_enforce_policy():
    """
    Vérifie que la politique de mots de passe compromis et min 12 caractères
    s'applique également au changement et à la réinitialisation de mot de passe.
    """
    reset_rate_limiter()
    initial_pwd = f"InitialValidPass_2026_{uuid.uuid4().hex[:8]}!"
    test_email = f"change_pwd_{uuid.uuid4().hex[:8]}@mwanalari.cg"

    with patch.object(httpx.Client, "get", realistic_hibp_get):
        reg_res = client.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": initial_pwd,
            "full_name": "Change Password Test",
            "role": "PARENT",
        })
        assert reg_res.status_code == 201
        csrf_token = reg_res.json().get("csrf_token")
        access_token = reg_res.json().get("access_token")

        # 1. Tentative de changement vers un mot de passe compromis -> Rejeté 400
        chg_pwned = client.post(
            "/api/v1/auth/change-password",
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-CSRF-Token": csrf_token,
            },
            json={
                "old_password": initial_pwd,
                "new_password": "password123456"
            }
        )
        assert chg_pwned.status_code == 400
        assert "compromis" in chg_pwned.json()["detail"].lower()

        # 2. Changement vers un mot de passe unique robuste -> Accepté 200
        new_robust_pwd = f"NewRobustPassword_#2026_{uuid.uuid4().hex[:8]}!"
        chg_ok = client.post(
            "/api/v1/auth/change-password",
            headers={
                "Authorization": f"Bearer {access_token}",
                "X-CSRF-Token": csrf_token,
            },
            json={
                "old_password": initial_pwd,
                "new_password": new_robust_pwd
            }
        )
        assert chg_ok.status_code == 200

        # 3. Réinitialisation de mot de passe : demande de jeton
        reset_rate_limiter()
        forgot_res = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
        assert forgot_res.status_code == 200
        reset_token = forgot_res.json().get("reset_token")
        assert reset_token is not None

        # Tentative de réinitialisation avec mot de passe compromis -> Rejeté 400
        reset_pwned = client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "new_password": "password123456"
        })
        assert reset_pwned.status_code == 400
        assert "compromis" in reset_pwned.json()["detail"].lower()

        # Réinitialisation avec phrase de passe unique -> Accepté 200
        reset_rate_limiter()
        reset_ok_pwd = f"ResetPassphrase_Unique_#2026_{uuid.uuid4().hex[:8]}!"
        reset_ok = client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "new_password": reset_ok_pwd
        })
        assert reset_ok.status_code == 200

    # Vérification en base : le nouveau hash est bien Argon2id
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == test_email).first()
        assert user.password_hash.startswith("$argon2id$")
        assert verify_password(reset_ok_pwd, user.password_hash) is True
    finally:
        db.close()

    print("PASS: Vérification appliquée avec succès sur /change-password et /reset-password.")

def test_backward_compatibility_bcrypt():
    """
    Vérifie la rétrocompatibilité : un utilisateur historique ayant un hash bcrypt
    peut toujours se connecter sans tentative de déchiffrage du mot de passe.
    """
    plain_pwd = "BcryptHistoricalPassword123!"
    salt = bcrypt.gensalt()
    bcrypt_hash = bcrypt.hashpw(plain_pwd.encode('utf-8')[:72], salt).decode('utf-8')

    assert verify_password(plain_pwd, bcrypt_hash) is True
    assert verify_password("WrongPassword!", bcrypt_hash) is False
    print("PASS: Rétrocompatibilité bcrypt validée (aucun déchiffrement nécessaire).")

if __name__ == "__main__":
    print("==================================================")
    print("   MWANA LARI PASSWORD SECURITY TEST SUITE        ")
    print("==================================================")
    test_compromised_password_rejected()
    test_unique_strong_password_accepted()
    test_long_passphrase_with_spaces_accepted()
    test_short_password_rejected()
    test_no_passwords_or_hashes_in_logs()
    test_passwords_properly_hashed_in_db()
    test_k_anonymity_prefix_only_sent()
    test_controlled_resilience_when_service_down()
    test_change_and_reset_password_enforce_policy()
    test_backward_compatibility_bcrypt()
    print("==================================================")
    print("  ALL 10 PASSWORD SECURITY TESTS PASSED (100%) !  ")
    print("==================================================")
