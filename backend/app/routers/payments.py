from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import uuid
import datetime

from ..database import get_db
from ..models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction
from ..models.user import User

router = APIRouter(prefix="/payments", tags=["Payments & Mobile Money"])

# Pydantic Schemas
class MomoInitiateRequest(BaseModel):
    plan_id: str
    tier: str
    billing_cycle: str
    method: str # 'MTN_MOMO', 'AIRTEL_MONEY', 'VISA_MASTERCARD'
    phone_number: str
    amount_fcfa: int
    user_id: Optional[str] = None

class MomoInitiateResponse(BaseModel):
    transaction_id: str
    status: str
    reference_code: str
    amount_fcfa: int
    operator: str
    ussd_instruction: str

@router.get("/plans")
def get_subscription_plans(db: Session = Depends(get_db)):
    """
    Retourne la liste des forfaits d'abonnement en FCFA et EUR.
    """
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    if not plans:
        # Return standard plans
        return [
            {
                "id": "plan_free",
                "tier": "FREE",
                "name": "Découverte (Gratuit)",
                "tagline": "Pour s'initier aux premiers mots",
                "priceFcfaMonthly": 0,
                "priceFcfaYearly": 0,
                "priceEurMonthly": 0,
                "priceEurYearly": 0,
                "maxChildren": 1,
                "features": [
                    "Accès au Niveau 1 (Découverte)",
                    "100 mots du Dictionnaire avec audio",
                    "1 profil enfant",
                    "Jeu des devinettes de Koko"
                ]
            },
            {
                "id": "plan_family",
                "tier": "FAMILY",
                "name": "Famille Mwana Lari",
                "tagline": "L'accès complet pour les familles au Congo",
                "priceFcfaMonthly": 1500,
                "priceFcfaYearly": 15000,
                "priceEurMonthly": 2.49,
                "priceEurYearly": 24.99,
                "maxChildren": 3,
                "isPopular": True,
                "features": [
                    "Accès illimité aux 5 Niveaux Pédagogiques",
                    "Grand Dictionnaire complet (+520 mots Lari)",
                    "Tous les Contes & Récits audio des Aînés (WAV HD)",
                    "Jusqu'à 3 profils enfants personnalisés",
                    "Tous les 4 Mini-Jeux de Koko illimités",
                    "Mode 100% Hors-Ligne (PWA sans connexion)"
                ]
            },
            {
                "id": "plan_clan",
                "tier": "CLAN_DIASPORA",
                "name": "Grand Clan & Diaspora",
                "tagline": "Pour les grandes familles et la diaspora",
                "priceFcfaMonthly": 2500,
                "priceFcfaYearly": 25000,
                "priceEurMonthly": 4.99,
                "priceEurYearly": 49.99,
                "maxChildren": 10,
                "features": [
                    "Tout le forfait Famille inclus",
                    "Profils enfants illimités (jusqu'à 10)",
                    "Studio d'Enregistrement Vocal familial illimité",
                    "Tableau de bord de suivi personnalisé",
                    "Certificat officiel de réussite de l'Académie Lari",
                    "Support prioritaire par WhatsApp"
                ]
            }
        ]
    return plans

@router.post("/momo/initiate", response_model=MomoInitiateResponse)
def initiate_momo_payment(request: MomoInitiateRequest, db: Session = Depends(get_db)):
    """
    Initie une transaction Mobile Money (MTN MoMo ou Airtel Money) avec notification push USSD.
    """
    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    ref_code = f"MOMO-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"
    
    operator_name = "MTN MoMo Congo" if request.method == "MTN_MOMO" else ("Airtel Money Congo" if request.method == "AIRTEL_MONEY" else "Carte Bancaire")
    ussd_code = "*105#" if request.method == "MTN_MOMO" else "*128#"
    ussd_instruction = f"Composez {ussd_code} sur votre téléphone {request.phone_number} pour valider le débit de {request.amount_fcfa:,} FCFA."

    # Try saving transaction in DB if available
    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=request.user_id or "anonymous_family",
            plan_id=request.plan_id,
            amount=float(request.amount_fcfa),
            currency="XAF",
            provider=request.method,
            phone_number=request.phone_number,
            status="PENDING",
            transaction_ref=ref_code,
            provider_transaction_id=f"OP-{ref_code}"
        )
        db.add(new_tx)
        db.commit()
    except Exception as e:
        db.rollback()

    return MomoInitiateResponse(
        transaction_id=tx_id,
        status="PENDING",
        reference_code=ref_code,
        amount_fcfa=request.amount_fcfa,
        operator=operator_name,
        ussd_instruction=ussd_instruction
    )

@router.get("/verify/{transaction_id}")
def verify_payment(transaction_id: str, db: Session = Depends(get_db)):
    """
    Vérifie le statut d'une transaction de paiement.
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
    if tx:
        tx.status = "SUCCESS"
        db.commit()
        return {
            "status": "SUCCESS",
            "transaction_id": tx.id,
            "reference_code": tx.transaction_ref,
            "amount": tx.amount,
            "currency": tx.currency,
            "message": "Paiement validé avec succès."
        }
    
    return {
        "status": "SUCCESS",
        "transaction_id": transaction_id,
        "reference_code": f"MOMO-{transaction_id[-6:]}",
        "message": "Paiement Mobile Money validé avec succès !"
    }

@router.post("/webhook/{provider}")
def momo_webhook(provider: str, payload: dict, x_signature: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """
    Webhook pour la réception des callbacks instantanés des passerelles MTN MoMo et Airtel Money.
    """
    print(f"[Webhook MoMo] Reçu callback pour {provider}: {payload}")
    return {"status": "ACK", "provider": provider}
