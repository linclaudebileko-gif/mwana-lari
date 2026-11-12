import sys
import os
import uuid
import datetime
import pytest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import SessionLocal
from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction, AppliedPayment
from app.config import settings

client = TestClient(app)

def setup_test_user(db: Session, phone: str = "242060001122"):
    email = f"user_{uuid.uuid4().hex[:6]}@mwanalari.cg"
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        phone_number=phone,
        password_hash="test_secret_hash",
        role="PARENT",
        full_name="Parent Test Secu",
        country_code="CG"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def test_webhook_without_auth_is_rejected():
    """
    P0: Le webhook OpenPay sans authentification et non validé par l'API
    doit être immédiatement rejeté avec HTTP 401.
    """
    db: Session = SessionLocal()
    phone = "242060001133"
    try:
        user = setup_test_user(db, phone)
        ref = f"PTXN-NOAUTH-{uuid.uuid4().hex[:8].upper()}"
        tx = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family_monthly",
            amount=1500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone,
            status="PENDING",
            transaction_ref=ref,
            provider_transaction_id=f"OP-{ref}"
        )
        db.add(tx)
        db.commit()

        # Envoi d'un webhook SANS en-tête d'authentification
        payload = {
            "reference": ref,
            "status": "success",
            "amount": 1500,
            "currency": "XAF"
        }
        res = client.post("/api/v1/payments/openpay/webhook", json=payload)
        # Doit être rejeté (401 Unauthorized car pas de preuve d'authenticité et non confirmée par l'API)
        assert res.status_code == 401
        assert "authentifi" in res.text.lower() or "authenticité" in res.text.lower()

        # Vérifier que l'abonnement n'a PAS été activé
        sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
        assert sub is None
    finally:
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

def test_webhook_missing_status_not_defaulted_to_success():
    """
    P0: Un webhook dont le statut est absent ne doit JAMAIS être considéré comme SUCCESS.
    """
    db: Session = SessionLocal()
    phone = "242060001144"
    try:
        user = setup_test_user(db, phone)
        ref = f"PTXN-NOSTAT-{uuid.uuid4().hex[:8].upper()}"
        tx = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family_monthly",
            amount=1500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone,
            status="PENDING",
            transaction_ref=ref,
            provider_transaction_id=f"OP-{ref}"
        )
        db.add(tx)
        db.commit()

        # Payload sans statut avec header auth
        payload = {
            "reference": ref,
            "amount": 1500,
            "currency": "XAF"
        }
        res = client.post(
            "/api/v1/payments/openpay/webhook",
            json=payload,
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )
        # Doit refuser avec 400 Bad Request
        assert res.status_code == 400
        assert "statut" in res.text.lower()

        db.refresh(tx)
        assert tx.status == "PENDING"
        sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
        assert sub is None
    finally:
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

def test_webhook_phone_only_activation_refused():
    """
    P0: La réconciliation par téléphone seul est formellement interdite.
    Une notification sans référence valide doit être rejetée.
    """
    db: Session = SessionLocal()
    phone = "242060001155"
    try:
        user = setup_test_user(db, phone)
        tx = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family_monthly",
            amount=1500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone,
            status="PENDING",
            transaction_ref=f"PTXN-HIDDEN-{uuid.uuid4().hex[:8]}",
            provider_transaction_id="OP-HIDDEN"
        )
        db.add(tx)
        db.commit()

        # Tentative d'activer avec seulement le téléphone sans référence
        payload = {
            "paymentPhoneNumber": phone,
            "status": "success",
            "amount": 1500
        }
        res = client.post(
            "/api/v1/payments/openpay/webhook",
            json=payload,
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )
        assert res.status_code == 400
        assert "référence" in res.text.lower()
    finally:
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

def test_webhook_amount_tampering_refused():
    """
    P0/P1: Un webhook rapportant un montant différent de la transaction enregistrée
    doit être rejeté pour falsification et la transaction marquée TAMPERED_FAILED.
    """
    db: Session = SessionLocal()
    phone = "242060001166"
    try:
        user = setup_test_user(db, phone)
        ref = f"PTXN-TAMPER-{uuid.uuid4().hex[:8].upper()}"
        tx = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family_monthly",
            amount=1500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone,
            status="PENDING",
            transaction_ref=ref,
            provider_transaction_id=f"OP-{ref}"
        )
        db.add(tx)
        db.commit()

        # Webhook avec montant falsifié (100 FCFA au lieu de 1500 FCFA)
        payload = {
            "reference": ref,
            "status": "success",
            "amount": 100,
            "currency": "XAF"
        }
        res = client.post(
            "/api/v1/payments/openpay/webhook",
            json=payload,
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )
        assert res.status_code == 400
        assert "montant" in res.text.lower() or "incohérent" in res.text.lower()

        db.refresh(tx)
        assert tx.status == "TAMPERED_FAILED"

        sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
        assert sub is None
    finally:
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

def test_client_controlled_price_rejected_at_initiation():
    """
    P1: L'initiation d'un paiement avec un montant arbitraire (ex: 100 FCFA au lieu de 1500 FCFA)
    doit être refusée côté serveur avec HTTP 400.
    """
    db: Session = SessionLocal()
    phone = "242060001177"
    try:
        user = setup_test_user(db, phone)

        # Tentative d'initiation avec montant manipulé
        payload = {
            "plan_id": "plan_family",
            "tier": "FAMILY",
            "billing_cycle": "monthly",
            "method": "MTN_MOMO",
            "phone_number": phone,
            "amount_fcfa": 100, # Vrai prix = 1500 FCFA
            "user_id": user.id
        }
        res = client.post("/api/v1/payments/openpay/initiate", json=payload)
        assert res.status_code == 400
        assert "tarification" in res.text.lower() or "1500" in res.text

        # Avec le bon montant, l'initiation doit réussir
        payload["amount_fcfa"] = 1500
        from unittest.mock import patch
        with patch("app.routers.payments.openpay_client.initiate_payment") as mock_init:
            mock_init.return_value = {
                "success": True,
                "mode": "TEST",
                "reference": f"OP-TEST-{uuid.uuid4().hex[:6]}",
                "status": "PENDING",
                "amount": "1500",
                "provider": "MTN",
                "message": "Demande envoyée."
            }
            res_ok = client.post("/api/v1/payments/openpay/initiate", json=payload)
            assert res_ok.status_code == 200
            data = res_ok.json()
            assert data.get("success") is True
            assert data.get("amount_fcfa") == 1500
            assert "consultation_token" in data
            assert len(data["consultation_token"]) > 20
    finally:
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

def test_replay_protection_prevents_duplicate_extension():
    """
    P1: Rejouer une ancienne transaction (après un second paiement) ne doit JAMAIS
    prolonger à nouveau l'abonnement grâce à la table persistante applied_payments.
    """
    db: Session = SessionLocal()
    phone = "242060001188"
    try:
        user = setup_test_user(db, phone)

        # 1. Premier paiement Tx1
        ref1 = f"PTXN-TEST-1-{uuid.uuid4().hex[:6].upper()}"
        tx1 = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family_monthly",
            amount=1500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone,
            status="PENDING",
            transaction_ref=ref1,
            provider_transaction_id=f"OP-{ref1}"
        )
        db.add(tx1)
        db.commit()

        # Valider Tx1 via webhook
        res1 = client.post(
            "/api/v1/payments/openpay/webhook",
            json={"reference": ref1, "status": "success", "amount": 1500},
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )
        assert res1.status_code == 200

        sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
        assert sub is not None
        assert sub.transaction_reference == ref1
        initial_end_date = sub.end_date

        # Vérifier présence dans applied_payments
        applied1 = db.query(AppliedPayment).filter(AppliedPayment.transaction_ref == ref1).first()
        assert applied1 is not None

        # 2. Deuxième paiement Tx2
        ref2 = f"PTXN-TEST-2-{uuid.uuid4().hex[:6].upper()}"
        tx2 = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family_monthly",
            amount=1500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone,
            status="PENDING",
            transaction_ref=ref2,
            provider_transaction_id=f"OP-{ref2}"
        )
        db.add(tx2)
        db.commit()

        res2 = client.post(
            "/api/v1/payments/openpay/webhook",
            json={"reference": ref2, "status": "success", "amount": 1500},
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )
        assert res2.status_code == 200

        db.refresh(sub)
        assert sub.transaction_reference == ref2
        extended_end_date = sub.end_date
        assert extended_end_date > initial_end_date

        # 3. REJEU DE TX1 : tenter de réappliquer l'ancienne transaction Tx1
        res_replay = client.post(
            "/api/v1/payments/openpay/webhook",
            json={"reference": ref1, "status": "success", "amount": 1500},
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )
        assert res_replay.status_code == 200

        # L'abonnement NE DOIT PAS avoir été prolongé à nouveau !
        db.refresh(sub)
        assert sub.end_date == extended_end_date
    finally:
        db.query(AppliedPayment).filter(AppliedPayment.user_id == user.id).delete()
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

def test_unauthenticated_transaction_consultation_rejected():
    """
    P2: Les routes /verify et /openpay/check doivent refuser la consultation sans session ou token.
    """
    db: Session = SessionLocal()
    phone = "242060001199"
    try:
        user = setup_test_user(db, phone)
        token = "secret_consultation_token_12345"
        ref = f"PTXN-CONSULT-{uuid.uuid4().hex[:6].upper()}"
        tx = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family_monthly",
            amount=1500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone,
            status="SUCCESS",
            transaction_ref=ref,
            provider_transaction_id=f"OP-{ref}",
            consultation_token=token
        )
        db.add(tx)
        db.commit()

        # 1. Consultation sans aucun jeton ni session -> 403 Forbidden
        res_verify_no_auth = client.get(f"/api/v1/payments/verify/{tx.id}")
        assert res_verify_no_auth.status_code == 403

        res_check_no_auth = client.get(f"/api/v1/payments/openpay/check/{ref}")
        assert res_check_no_auth.status_code == 403

        # 2. Consultation avec faux token -> 403 Forbidden
        res_bad_token = client.get(f"/api/v1/payments/verify/{tx.id}?token=invalid_token")
        assert res_bad_token.status_code == 403

        # 3. Consultation avec token valide -> 200 OK
        res_valid_token = client.get(f"/api/v1/payments/verify/{tx.id}?token={token}")
        assert res_valid_token.status_code == 200
        data = res_valid_token.json()
        assert data.get("status") == "SUCCESS"
        assert data.get("amount") == 1500.0
        # Vérifier que les informations sensibles du payer ne sont pas exposées
        assert "phone_number" not in data
        assert "user_id" not in data
    finally:
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

def test_production_security_config_rejection():
    """
    P2: En environnement de production, les secrets par défaut ou l'activation de la simulation
    doivent lever une exception bloquante au démarrage.
    """
    from app.config import Settings, DEFAULT_DEV_SECRET, DEFAULT_DEV_WEBHOOK_SECRET

    # Test avec SECRET_KEY par défaut en production -> doit lever RuntimeError
    cfg_bad_jwt = Settings(
        ENVIRONMENT="production",
        SECRET_KEY=DEFAULT_DEV_SECRET,
        WEBHOOK_SECRET="custom_strong_secret_1234567890",
        ALLOW_PAYMENT_SIMULATION=False
    )
    with pytest.raises(RuntimeError) as exc_info:
        cfg_bad_jwt.validate_production_security()
    assert "SECRET_KEY" in str(exc_info.value)

    # Test avec simulation activée en production -> doit lever RuntimeError
    cfg_bad_sim = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="custom_strong_jwt_key_1234567890",
        WEBHOOK_SECRET="custom_strong_secret_1234567890",
        ALLOW_PAYMENT_SIMULATION=True
    )
    with pytest.raises(RuntimeError) as exc_info:
        cfg_bad_sim.validate_production_security()
    assert "ALLOW_PAYMENT_SIMULATION" in str(exc_info.value)

if __name__ == "__main__":
    print("[*] Running test_webhook_without_auth_is_rejected...")
    test_webhook_without_auth_is_rejected()
    print("[OK] test_webhook_without_auth_is_rejected")

    print("[*] Running test_webhook_missing_status_not_defaulted_to_success...")
    test_webhook_missing_status_not_defaulted_to_success()
    print("[OK] test_webhook_missing_status_not_defaulted_to_success")

    print("[*] Running test_webhook_phone_only_activation_refused...")
    test_webhook_phone_only_activation_refused()
    print("[OK] test_webhook_phone_only_activation_refused")

    print("[*] Running test_webhook_amount_tampering_refused...")
    test_webhook_amount_tampering_refused()
    print("[OK] test_webhook_amount_tampering_refused")

    print("[*] Running test_client_controlled_price_rejected_at_initiation...")
    test_client_controlled_price_rejected_at_initiation()
    print("[OK] test_client_controlled_price_rejected_at_initiation")

    print("[*] Running test_replay_protection_prevents_duplicate_extension...")
    test_replay_protection_prevents_duplicate_extension()
    print("[OK] test_replay_protection_prevents_duplicate_extension")

    print("[*] Running test_unauthenticated_transaction_consultation_rejected...")
    test_unauthenticated_transaction_consultation_rejected()
    print("[OK] test_unauthenticated_transaction_consultation_rejected")

    print("[*] Running test_production_security_config_rejection...")
    test_production_security_config_rejection()
    print("[OK] test_production_security_config_rejection")

    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")

