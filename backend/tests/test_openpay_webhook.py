import uuid
import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction
from app.config import settings

client = TestClient(app)

def test_openpay_webhook_flow_and_subscription_activation():
    db: Session = SessionLocal()
    phone_test = "242060009999"
    test_email = f"parent_test_{uuid.uuid4().hex[:6]}@mwanalari.cg"

    try:
        # 1. Obtenir ou créer l'utilisateur de test
        user = db.query(User).filter(User.phone_number == phone_test).first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=test_email,
                phone_number=phone_test,
                password_hash="test_hash",
                role="PARENT",
                full_name="Parent Test MTN",
                country_code="CG"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 2. Créer une transaction PENDING pour ce numéro et cet utilisateur
        test_ref = f"PTXN-TEST-{uuid.uuid4().hex[:8].upper()}"
        tx = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_family",
            amount=100.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone_test,
            status="PENDING",
            transaction_ref=test_ref,
            provider_transaction_id=f"OP-{test_ref}"
        )
        db.add(tx)
        db.commit()

        # Vérifier qu'il n'y a pas encore d'abonnement actif
        sub_before = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
        assert sub_before is None

        # 3. Envoyer un webhook OpenPay de succès sur /api/v1/payments/openpay/webhook
        webhook_payload = {
            "reference": test_ref,
            "amount": "100",
            "currency": "XAF",
            "paymentPhoneNumber": phone_test,
            "provider": "MTN",
            "type": "payment",
            "status": "success",
            "message": "Paiement effectué avec succès",
            "metadata": {
                "plan_id": "plan_family",
                "user_id": user.id
            }
        }

        response = client.post(
            "/api/v1/payments/openpay/webhook",
            json=webhook_payload,
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )

        assert response.status_code == 200, f"Webhook failed: {response.text}"
        res_json = response.json()
        assert res_json.get("status") == "SUCCESS"
        assert res_json.get("activated") is True

        # 4. Vérifier la mise à jour de la transaction en base de données
        db.refresh(tx)
        assert tx.status == "SUCCESS"
        assert tx.plan_id == "plan_family_monthly"

        # 5. Vérifier l'activation automatique de l'abonnement
        sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
        assert sub is not None
        assert sub.status == "ACTIVE"
        assert sub.plan_id == "plan_family_monthly"
        assert sub.payment_method == "OPENPAY_MTN"
        assert sub.end_date is not None
        assert sub.end_date > datetime.datetime.utcnow()

        # 6. Tester également l'alias root-level /payments/openpay/webhook
        test_ref_alias = f"PTXN-ALIAS-{uuid.uuid4().hex[:8].upper()}"
        tx_alias = PaymentTransaction(
            id=f"tx_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            plan_id="plan_clan",
            amount=2500.0,
            currency="XAF",
            provider="OPENPAY_MTN",
            phone_number=phone_test,
            status="PENDING",
            transaction_ref=test_ref_alias,
            provider_transaction_id=f"OP-{test_ref_alias}"
        )
        db.add(tx_alias)
        db.commit()

        alias_payload = {
            "reference": test_ref_alias,
            "status": "completed",
            "amount": "2500"
        }
        alias_resp = client.post(
            "/payments/openpay/webhook",
            json=alias_payload,
            headers={"XO-API-KEY": settings.OPENPAY_API_KEY}
        )
        assert alias_resp.status_code == 200
        assert alias_resp.json().get("activated") is True

        db.refresh(tx_alias)
        assert tx_alias.status == "SUCCESS"

        # L'abonnement doit maintenant être mis à jour sur CLAN et prolongé
        db.refresh(sub)
        assert sub.status == "ACTIVE"
        assert sub.plan_id == "plan_clan_monthly"

        print("[TEST OK] Webhook OpenPay et activation automatique validés avec succès !")

    finally:
        # Nettoyage
        db.query(PaymentTransaction).filter(PaymentTransaction.phone_number == phone_test).delete()
        db.query(UserSubscription).filter(UserSubscription.user_id == user.id).delete()
        db.query(User).filter(User.id == user.id).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    test_openpay_webhook_flow_and_subscription_activation()
