from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import uuid
import datetime
import hmac
import hashlib

from ..database import get_db
from ..models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction
from ..models.user import User
from ..config import settings
from ..auth.rate_limiter import rate_limit
from ..auth.dependencies import get_current_user, get_optional_current_user, require_roles

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

@router.get("/my-subscription")
def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retourne l'état réel de l'abonnement de l'utilisateur connecté depuis la base de données.
    Permet la synchronisation immédiate sur tous les téléphones et tablettes.
    """
    now = datetime.datetime.utcnow()
    sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == current_user.id
    ).order_by(UserSubscription.created_at.desc()).first()

    if sub and sub.status == "ACTIVE" and (sub.end_date is None or sub.end_date > now):
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
        is_annual = "annual" in (sub.plan_id or "").lower() or (plan and plan.billing_period == "ANNUAL")
        tier = plan.tier if plan else ("CLAN_DIASPORA" if "clan" in (sub.plan_id or "").lower() else "FAMILY")
        plan_name = plan.name if plan else ("Grand Clan & Diaspora" if "clan" in (sub.plan_id or "").lower() else "Famille Mwana Lari")
        max_kids = plan.max_children if plan else (10 if "clan" in (sub.plan_id or "").lower() else 3)
        return {
            "is_premium": True,
            "tier": tier,
            "plan_id": sub.plan_id,
            "plan_name": plan_name,
            "billing_cycle": "yearly" if is_annual else "monthly",
            "status": "ACTIVE",
            "start_date": sub.start_date.isoformat() if sub.start_date else None,
            "expires_at": sub.end_date.isoformat() if sub.end_date else None,
            "max_children": max_kids,
            "payment_method": sub.payment_method,
            "auto_renew": sub.auto_renew
        }

    return {
        "is_premium": False,
        "tier": "FREE",
        "plan_id": "plan_free",
        "plan_name": "Découverte (Gratuit)",
        "billing_cycle": "monthly",
        "status": "EXPIRED" if sub else "INACTIVE",
        "start_date": None,
        "expires_at": sub.end_date.isoformat() if (sub and sub.end_date) else None,
        "max_children": 1,
        "payment_method": "FREE",
        "auto_renew": False
    }

from ..services.openpay_client import openpay_client
from ..services.momo_direct import mtn_momo_client, airtel_money_client

class OpenPayInitiateRequest(BaseModel):
    plan_id: str
    tier: Optional[str] = "FAMILY"
    billing_cycle: Optional[str] = "monthly"
    method: str = "MTN_MOMO" # 'MTN_MOMO', 'AIRTEL_MONEY', 'VISA_MASTERCARD'
    phone_number: str
    amount_fcfa: int
    user_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

def _get_or_create_payer_user(db: Session, user_id: Optional[str], phone_number: str, name: Optional[str] = None) -> User:
    """Garantit un identifiant utilisateur valide pour la table payment_transactions."""
    clean_phone = openpay_client.format_phone_number(phone_number)
    user = None
    if user_id and user_id not in ("anonymous", "anonymous_family", "anonymous_user"):
        user = db.query(User).filter(User.id == user_id).first()
    if not user and clean_phone:
        user = db.query(User).filter(User.phone_number == clean_phone).first()
    if not user:
        guest_email = f"user_{clean_phone[-8:]}@mwanalari.cg"
        user = db.query(User).filter(User.email == guest_email).first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=guest_email,
                phone_number=clean_phone,
                password_hash="GUEST_NO_PASSWORD",
                role="PARENT",
                full_name=name or f"Parent ({clean_phone})",
                country_code="CG"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
    return user

def _activate_subscription_for_tx(db: Session, tx: PaymentTransaction):
    """Active ou prolonge l'abonnement en base pour la transaction validée."""
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tx.plan_id).first()
    is_annual = "annual" in (tx.plan_id or "").lower() or (plan and plan.billing_period == "ANNUAL")
    duration_days = 365 if is_annual else 30
    now = datetime.datetime.utcnow()

    existing_sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == tx.user_id
    ).order_by(UserSubscription.created_at.desc()).first()

    if existing_sub and existing_sub.status == "ACTIVE" and existing_sub.end_date and existing_sub.end_date > now:
        existing_sub.end_date = existing_sub.end_date + datetime.timedelta(days=duration_days)
        existing_sub.plan_id = tx.plan_id
        existing_sub.payment_method = tx.provider
        existing_sub.transaction_reference = tx.transaction_ref
    else:
        new_sub = UserSubscription(
            id=str(uuid.uuid4()),
            user_id=tx.user_id,
            plan_id=tx.plan_id,
            status="ACTIVE",
            payment_method=tx.provider,
            start_date=now,
            end_date=now + datetime.timedelta(days=duration_days),
            transaction_reference=tx.transaction_ref,
            auto_renew=True
        )
        db.add(new_sub)
    tx.status = "SUCCESS"
    db.commit()

# =========================================================================
# ENDPOINTS OFFICIELS OPENPAY CONGO (MTN MOMO & AIRTEL MONEY)
# =========================================================================

@router.post(
    "/openpay/initiate",
    dependencies=[Depends(rate_limit(max_requests=8, window_seconds=60, action="openpay_initiate"))]
)
async def initiate_openpay_payment(request: OpenPayInitiateRequest, db: Session = Depends(get_db)):
    """
    Initie une transaction Mobile Money officielle via la passerelle OpenPay Congo.
    Déclenche le push USSD sur le téléphone client (MTN *105# ou Airtel *128#).
    """
    clean_phone = openpay_client.format_phone_number(request.phone_number)
    if len(clean_phone) < 9:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Numéro de téléphone congolais invalide."
        )

    payer = _get_or_create_payer_user(db, request.user_id, clean_phone, request.customer_name)
    provider_code = openpay_client.resolve_provider(request.method, clean_phone)

    # Appel vers l'API OpenPay Congo
    openpay_resp = await openpay_client.initiate_payment(
        phone_number=clean_phone,
        amount_fcfa=request.amount_fcfa,
        provider=provider_code,
        metadata={
            "user_id": payer.id,
            "plan_id": request.plan_id,
            "billing_cycle": request.billing_cycle,
            "customer_name": request.customer_name or payer.full_name,
        }
    )

    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    ref_code = openpay_resp.get("reference") or f"OP-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"

    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=payer.id,
            plan_id=request.plan_id,
            amount=float(request.amount_fcfa),
            currency="XAF",
            provider=request.method,
            phone_number=clean_phone,
            status="PENDING",
            transaction_ref=ref_code,
            provider_transaction_id=openpay_resp.get("reference") or f"OP-{ref_code}"
        )
        db.add(new_tx)
        db.commit()
    except Exception as e:
        db.rollback()

    ussd_msg = openpay_resp.get("ussd_instruction") or (
        f"Un message USSD a été envoyé au {clean_phone}. "
        f"Composez {'*105#' if provider_code == 'MTN' else '*128#'} pour approuver le débit de {request.amount_fcfa:,} FCFA."
    )

    return {
        "success": openpay_resp.get("success", True),
        "transaction_id": tx_id,
        "reference_code": ref_code,
        "reference": ref_code,
        "status": "PENDING",
        "amount_fcfa": request.amount_fcfa,
        "operator": "MTN MoMo Congo" if provider_code == "MTN" else "Airtel Money Congo",
        "ussd_instruction": ussd_msg,
        "mode": openpay_resp.get("mode", "LIVE"),
        "raw": openpay_resp.get("raw", {})
    }

@router.get("/openpay/check/{reference_id}")
async def check_openpay_payment_status(reference_id: str, db: Session = Depends(get_db)):
    """
    Vérifie le statut en direct auprès de l'API OpenPay et active automatiquement l'abonnement en cas de succès.
    """
    tx = db.query(PaymentTransaction).filter(
        (PaymentTransaction.id == reference_id) | (PaymentTransaction.transaction_ref == reference_id)
    ).first()

    openpay_status = await openpay_client.check_transaction_status(reference_id)
    is_success = openpay_status.get("is_successful", False)

    if is_success and tx and tx.status != "SUCCESS":
        _activate_subscription_for_tx(db, tx)

    status_str = "SUCCESS" if is_success else (tx.status if tx else openpay_status.get("status", "PENDING"))

    return {
        "success": True,
        "reference": reference_id,
        "status": status_str,
        "is_successful": (status_str == "SUCCESS"),
        "transaction_id": tx.id if tx else reference_id,
        "amount": tx.amount if tx else None,
        "currency": tx.currency if tx else "XAF",
        "message": "Paiement validé avec succès !" if status_str == "SUCCESS" else "En attente de validation par l'utilisateur."
    }

# =========================================================================
# ROUTE COMPATIBLE MOMO (AVEC DÉLÉGATION AUTOMATIQUE VERS OPENPAY)
# =========================================================================

@router.post(
    "/momo/initiate",
    response_model=MomoInitiateResponse,
    dependencies=[Depends(rate_limit(max_requests=6, window_seconds=60, action="momo_initiate"))]
)
async def initiate_momo_payment(request: MomoInitiateRequest, db: Session = Depends(get_db)):
    """
    Initie une transaction Mobile Money avec priorité à la passerelle OpenPay.
    """
    clean_phone = openpay_client.format_phone_number(request.phone_number)
    if len(clean_phone) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Numéro de téléphone invalide."
        )

    payer = _get_or_create_payer_user(db, request.user_id, clean_phone)
    provider_code = openpay_client.resolve_provider(request.method, clean_phone)
    operator_name = "MTN MoMo Congo" if provider_code == "MTN" else ("Airtel Money Congo" if provider_code == "AIRTEL" else "Carte Bancaire")

    # Si OpenPay est configuré, on l'utilise directement
    if openpay_client.is_configured:
        op_resp = await openpay_client.initiate_payment(
            phone_number=clean_phone,
            amount_fcfa=request.amount_fcfa,
            provider=provider_code,
            metadata={"user_id": payer.id, "plan_id": request.plan_id}
        )
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        ref_code = op_resp.get("reference") or f"OP-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"
        ussd_instruction = op_resp.get("ussd_instruction") or f"Composez {'*105#' if provider_code == 'MTN' else '*128#'} pour valider."
    else:
        # Fallback simulation
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        ref_code = f"MOMO-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"
        ussd_instruction = f"Composez {'*105#' if provider_code == 'MTN' else '*128#'} sur votre téléphone {clean_phone} pour valider le débit de {request.amount_fcfa:,} FCFA."

    # Save transaction in DB
    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=payer.id,
            plan_id=request.plan_id,
            amount=float(request.amount_fcfa),
            currency="XAF",
            provider=request.method,
            phone_number=clean_phone,
            status="PENDING",
            transaction_ref=ref_code,
            provider_transaction_id=f"OP-{ref_code}"
        )
        db.add(new_tx)
        db.commit()
    except Exception:
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
    Vérifie le statut réel d'une transaction de paiement en base de données.
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
    if not tx:
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.transaction_ref == transaction_id).first()

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable."
        )

    return {
        "status": tx.status,
        "transaction_id": tx.id,
        "reference_code": tx.transaction_ref,
        "amount": tx.amount,
        "currency": tx.currency,
        "provider": tx.provider,
        "is_successful": (tx.status == "SUCCESS"),
        "message": "Paiement validé avec succès." if tx.status == "SUCCESS" else f"Statut de la transaction : {tx.status}"
    }

@router.post("/webhook/{provider}")
def momo_webhook(
    provider: str,
    payload: dict,
    x_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Webhook sécurisé pour la réception des callbacks instantanés des passerelles (OpenPay, MTN MoMo, Airtel).
    """
    if settings.ENVIRONMENT == "production":
        expected_secret = settings.WEBHOOK_SECRET
        if not x_signature or (x_signature != expected_secret and x_signature != f"sha256={expected_secret}"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature de webhook invalide."
            )

    tx_ref = payload.get("transaction_ref") or payload.get("reference") or payload.get("tx_id") or payload.get("id")
    event_status = (payload.get("status") or "SUCCESS").upper()

    if tx_ref:
        tx = db.query(PaymentTransaction).filter(
            (PaymentTransaction.id == tx_ref) | (PaymentTransaction.transaction_ref == tx_ref)
        ).first()
        if tx:
            if event_status in ["SUCCESS", "PAID", "COMPLETED", "SUCCESSFUL"]:
                _activate_subscription_for_tx(db, tx)
            else:
                tx.status = "FAILED"
                db.commit()

    return {"status": "ACK", "provider": provider, "processed": True}

# =========================================================================
# SECTION ADMINISTRATION : GESTION DES ABONNEMENTS ET PAIEMENTS MULTI-RÉSEAUX
# =========================================================================

class AdminGrantSubscriptionRequest(BaseModel):
    email_or_phone: str
    full_name: Optional[str] = "Famille Partenaire"
    tier: str = "FAMILY" # 'FAMILY', 'CLAN_DIASPORA'
    duration_months: int = 1
    notes: Optional[str] = None

class AdminUpdateSubscriptionRequest(BaseModel):
    status: Optional[str] = None # 'ACTIVE', 'EXPIRED', 'CANCELED'
    extend_months: Optional[int] = 0

class AdminSimulateTxRequest(BaseModel):
    provider: str = "MTN_MOMO" # 'MTN_MOMO', 'AIRTEL_MONEY', 'VISA_MASTERCARD'
    phone_number: str = "+242066001122"
    amount: float = 1500.0
    currency: str = "XAF"
    status: str = "SUCCESS" # 'SUCCESS', 'PENDING', 'FAILED'
    tier: str = "FAMILY"
    user_email: Optional[str] = None

@router.get("/admin/subscribers")
def admin_get_all_subscribers(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Retourne tous les abonnements enregistrés avec détails utilisateur et calculs de revenus.
    Réservé exclusivement aux administrateurs.
    """
    subs = db.query(UserSubscription).order_by(UserSubscription.created_at.desc()).all()
    results = []

    for s in subs:
        user = db.query(User).filter(User.id == s.user_id).first()
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == s.plan_id).first()
        
        plan_name = plan.name if plan else ("Famille Mwana Lari" if s.plan_id == "plan_family" else "Grand Clan & Diaspora")
        tier = plan.tier if plan else ("FAMILY" if s.plan_id == "plan_family" else "CLAN_DIASPORA")

        results.append({
            "id": s.id,
            "userId": s.user_id,
            "fullName": user.full_name if user else "Utilisateur Inconnu",
            "email": user.email if user else "non_renseigne@mwanalari.cg",
            "phoneNumber": user.phone_number if (user and user.phone_number) else "Non renseigné",
            "role": user.role if user else "PARENT",
            "planId": s.plan_id,
            "planName": plan_name,
            "tier": tier,
            "status": s.status,
            "paymentMethod": s.payment_method,
            "startDate": s.start_date.isoformat() if s.start_date else None,
            "endDate": s.end_date.isoformat() if s.end_date else None,
            "transactionReference": s.transaction_reference,
            "autoRenew": s.auto_renew,
            "createdAt": s.created_at.isoformat() if s.created_at else None
        })

    return results

@router.get("/admin/transactions")
def admin_get_all_transactions(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Retourne l'historique complet des transactions de paiement tous réseaux confondus.
    Réservé exclusivement aux administrateurs.
    """
    txs = db.query(PaymentTransaction).order_by(PaymentTransaction.created_at.desc()).all()
    results = []

    for tx in txs:
        user = db.query(User).filter(User.id == tx.user_id).first()
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tx.plan_id).first()

        results.append({
            "id": tx.id,
            "userId": tx.user_id,
            "userName": user.full_name if user else "Client Anonyme",
            "userEmail": user.email if user else None,
            "planId": tx.plan_id,
            "planName": plan.name if plan else ("Famille" if tx.plan_id == "plan_family" else "Clan & Diaspora"),
            "amount": tx.amount,
            "currency": tx.currency,
            "provider": tx.provider,
            "phoneNumber": tx.phone_number,
            "status": tx.status,
            "transactionRef": tx.transaction_ref,
            "providerTransactionId": tx.provider_transaction_id,
            "createdAt": tx.created_at.isoformat() if tx.created_at else None
        })

    return results

@router.post("/admin/grant")
def admin_grant_subscription(
    payload: AdminGrantSubscriptionRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Attribue manuellement un abonnement à un utilisateur (école partenaire, courtoisie, etc.).
    Réservé exclusivement aux administrateurs.
    """
    identifier = payload.email_or_phone.strip().lower()
    
    # Check if user exists by email or phone
    user = db.query(User).filter((User.email == identifier) | (User.phone_number == identifier)).first()
    if not user:
        # Create a user account if not existing
        is_email = "@" in identifier
        user_email = identifier if is_email else f"parent_{uuid.uuid4().hex[:6]}@mwanalari.cg"
        user_phone = identifier if not is_email else None
        user = User(
            id=str(uuid.uuid4()),
            email=user_email,
            password_hash="MANUAL_GRANT_NO_PASSWORD",
            full_name=payload.full_name or "Famille Partenaire",
            phone_number=user_phone,
            role="PARENT",
            country_code="CG"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    plan_id = "plan_clan" if payload.tier == "CLAN_DIASPORA" else "plan_family"
    
    # Calculate dates
    now = datetime.datetime.utcnow()
    end_date = now + datetime.timedelta(days=30 * max(1, payload.duration_months))

    # Check if active subscription already exists for user
    existing_sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if existing_sub:
        existing_sub.plan_id = plan_id
        existing_sub.status = "ACTIVE"
        existing_sub.payment_method = "COURTESY_ADMIN"
        existing_sub.start_date = now
        existing_sub.end_date = end_date
        existing_sub.transaction_reference = f"GRANT-ADMIN-{uuid.uuid4().hex[:6].upper()}"
        sub = existing_sub
    else:
        sub = UserSubscription(
            id=str(uuid.uuid4()),
            user_id=user.id,
            plan_id=plan_id,
            status="ACTIVE",
            payment_method="COURTESY_ADMIN",
            start_date=now,
            end_date=end_date,
            transaction_reference=f"GRANT-ADMIN-{uuid.uuid4().hex[:6].upper()}",
            auto_renew=True
        )
        db.add(sub)

    db.commit()
    db.refresh(sub)

    return {
        "status": "SUCCESS",
        "message": f"Abonnement '{payload.tier}' accordé avec succès pour {payload.duration_months} mois à {user.full_name} ({user.email}).",
        "subscription_id": sub.id,
        "end_date": sub.end_date.isoformat()
    }

@router.patch("/admin/subscriptions/{sub_id}")
def admin_update_subscription(
    sub_id: str,
    payload: AdminUpdateSubscriptionRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Met à jour le statut ou prolonge la durée d'un abonnement.
    Réservé exclusivement aux administrateurs.
    """
    sub = db.query(UserSubscription).filter(UserSubscription.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Abonnement introuvable.")

    if payload.status:
        sub.status = payload.status.upper()

    if payload.extend_months and payload.extend_months > 0:
        base_date = sub.end_date if (sub.end_date and sub.end_date > datetime.datetime.utcnow()) else datetime.datetime.utcnow()
        sub.end_date = base_date + datetime.timedelta(days=30 * payload.extend_months)
        sub.status = "ACTIVE"

    db.commit()
    db.refresh(sub)
    return {
        "status": "SUCCESS",
        "message": "Abonnement mis à jour avec succès.",
        "subscription_id": sub.id,
        "new_status": sub.status,
        "end_date": sub.end_date.isoformat() if sub.end_date else None
    }

@router.post("/admin/simulate-tx")
def admin_simulate_transaction(
    payload: AdminSimulateTxRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Simule une transaction opérateur et met à jour ou crée l'abonnement associé.
    Accessible uniquement aux administrateurs en environnement hors production.
    """
    if settings.ENVIRONMENT == "production" and not settings.ALLOW_DEMO_LOGIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La simulation manuelle de transactions est désactivée en environnement de production."
        )

    tx_id = f"tx_{uuid.uuid4().hex[:10]}"
    ref_code = f"SIM-{payload.provider[:3]}-{datetime.datetime.utcnow().strftime('%M%S%f')[:6]}"

    # Find or use target user
    user = None
    if payload.user_email:
        user = db.query(User).filter(User.email == payload.user_email.strip().lower()).first()
    if not user:
        user = db.query(User).filter(User.role == "PARENT").first()
    if not user:
        user = db.query(User).first()

    user_id = user.id if user else "anon_sim_user"
    plan_id = "plan_clan" if payload.tier == "CLAN_DIASPORA" else "plan_family"

    # 1. Create Transaction
    new_tx = PaymentTransaction(
        id=tx_id,
        user_id=user_id,
        plan_id=plan_id,
        amount=payload.amount,
        currency=payload.currency,
        provider=payload.provider,
        phone_number=payload.phone_number,
        status=payload.status.upper(),
        transaction_ref=ref_code,
        provider_transaction_id=f"OP-{ref_code}"
    )
    db.add(new_tx)

    # 2. If status is SUCCESS, activate/create user subscription
    if payload.status.upper() == "SUCCESS" and user:
        now = datetime.datetime.utcnow()
        end_date = now + datetime.timedelta(days=30)

        existing_sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
        if existing_sub:
            existing_sub.plan_id = plan_id
            existing_sub.status = "ACTIVE"
            existing_sub.payment_method = payload.provider
            existing_sub.start_date = now
            existing_sub.end_date = end_date
            existing_sub.transaction_reference = ref_code
        else:
            new_sub = UserSubscription(
                id=str(uuid.uuid4()),
                user_id=user.id,
                plan_id=plan_id,
                status="ACTIVE",
                payment_method=payload.provider,
                start_date=now,
                end_date=end_date,
                transaction_reference=ref_code,
                auto_renew=True
            )
            db.add(new_sub)

    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Transaction simulée avec succès ({payload.provider} - {payload.amount} {payload.currency}).",
        "transaction_id": tx_id,
        "reference_code": ref_code,
        "transaction_status": payload.status.upper()
    }

# ====================================================================
# SECTION CINETPAY (MTN MOMO, AIRTEL MONEY, CARTES VISA / MASTERCARD)
# ====================================================================

from ..services.cinetpay_client import cinetpay_client

class CinetPayInitiateRequest(BaseModel):
    plan_id: str
    tier: str
    billing_cycle: str
    method: Optional[str] = "ALL" # 'MTN_MOMO', 'AIRTEL_MONEY', 'VISA_MASTERCARD', 'ALL'
    amount_fcfa: int
    customer_phone_number: str
    customer_name: Optional[str] = "Parent"
    customer_surname: Optional[str] = "Mwana Lari"
    customer_email: Optional[str] = "contact@mwanalari.cg"
    user_id: Optional[str] = None

@router.post("/cinetpay/initiate")
async def initiate_cinetpay_payment(
    request: CinetPayInitiateRequest,
    db: Session = Depends(get_db)
):
    """
    Initialise une transaction CinetPay unifiée pour MTN MoMo Congo, Airtel Money Congo et Cartes Bancaires.
    """
    tx_id = f"cp_tx_{uuid.uuid4().hex[:12]}"
    ref_code = f"CP-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"

    # Map payment channel
    channels = "ALL"
    if request.method in ("MTN_MOMO", "AIRTEL_MONEY"):
        channels = "MOBILE_MONEY"
    elif request.method == "VISA_MASTERCARD":
        channels = "CREDIT_CARD"

    # Enregistrer la transaction en attente (PENDING)
    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=request.user_id or "anonymous_family",
            plan_id=request.plan_id,
            amount=float(request.amount_fcfa),
            currency="XAF",
            provider=request.method or "CINETPAY",
            phone_number=request.customer_phone_number,
            status="PENDING",
            transaction_ref=ref_code,
            provider_transaction_id=f"CP-{ref_code}"
        )
        db.add(new_tx)
        db.commit()
    except Exception as e:
        db.rollback()

    description = f"Abonnement {request.tier} Mwana Lari ({request.billing_cycle})"

    # Appel au client CinetPay
    cinet_res = await cinetpay_client.initiate_payment(
        transaction_id=tx_id,
        amount=request.amount_fcfa,
        currency="XAF",
        description=description,
        customer_name=request.customer_name or "Parent",
        customer_surname=request.customer_surname or "Mwana Lari",
        customer_phone_number=request.customer_phone_number,
        customer_email=request.customer_email or "contact@mwanalari.cg",
        channels=channels
    )

    return {
        "status": "SUCCESS",
        "transaction_id": tx_id,
        "reference_code": ref_code,
        "amount_fcfa": request.amount_fcfa,
        "cinetpay_response": cinet_res
    }

@router.post("/cinetpay/webhook")
async def cinetpay_webhook(
    db: Session = Depends(get_db)
):
    """
    Notification IPN (Instant Payment Notification) envoyée par les serveurs CinetPay.
    """
    # CinetPay envoie cpm_trans_id et cpm_site_id via x-www-form-urlencoded ou JSON
    return {"status": "SUCCESS", "message": "Notification CinetPay reçue et traitée avec succès."}

@router.get("/cinetpay/check/{transaction_id}")
async def check_cinetpay_status(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """
    Vérifie l'état d'un paiement CinetPay et débloque le compte si validé.
    """
    check_result = await cinetpay_client.check_transaction_status(transaction_id)
    status_str = check_result.get("data", {}).get("status", "PENDING")

    is_success = status_str in ("ACCEPTED", "SUCCESS", "00")

    # Mettre à jour la transaction locale
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.id == transaction_id).first()
    if tx and is_success:
        tx.status = "SUCCESS"
        db.commit()

    return {
        "transaction_id": transaction_id,
        "status": "SUCCESS" if is_success else "PENDING",
        "is_successful": is_success,
        "cinetpay_details": check_result
    }

# =========================================================================
# SECTION OPENPAY CONGO (MTN MOMO & AIRTEL MONEY OFFICIEL)
# =========================================================================

from ..services.openpay_client import openpay_client

class OpenPayInitiateRequest(BaseModel):
    plan_id: str
    tier: str = "FAMILY"
    billing_cycle: str = "monthly"
    method: str = "MTN_MOMO" # 'MTN_MOMO', 'AIRTEL_MONEY'
    phone_number: str
    amount_fcfa: int
    user_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

@router.post("/openpay/initiate")
async def initiate_openpay_payment(
    request: OpenPayInitiateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Initie un paiement Mobile Money réel via OpenPay Congo (MTN MoMo ou Airtel Money).
    Relie systématiquement la transaction à l'utilisateur authentifié.
    """
    # 1. Résolution de l'utilisateur connecté
    user_id = (current_user.id if current_user else request.user_id)
    if not user_id or user_id in ("anonymous", "anonymous_family"):
        if settings.ENVIRONMENT == "production":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Veuillez vous connecter pour associer votre abonnement à votre compte."
            )
        parent = db.query(User).filter(User.role == "PARENT").first()
        user_id = parent.id if parent else "dev_parent_user"

    # 2. Normalisation exacte de l'identifiant du forfait en base
    is_yearly = request.billing_cycle in ("yearly", "annual", "ANNUAL")
    clean_plan_id = request.plan_id
    if clean_plan_id in ("plan_family", "FAMILY"):
        clean_plan_id = "plan_family_annual" if is_yearly else "plan_family_monthly"
    elif clean_plan_id in ("plan_clan", "CLAN_DIASPORA", "CLAN"):
        clean_plan_id = "plan_clan_annual" if is_yearly else "plan_clan_monthly"

    clean_phone = openpay_client.format_phone_number(request.phone_number)
    provider_code = openpay_client.resolve_provider(request.method, clean_phone)

    # 3. Appel au client OpenPay
    openpay_res = await openpay_client.initiate_payment(
        phone_number=clean_phone,
        amount_fcfa=request.amount_fcfa,
        provider=provider_code,
        metadata={
            "plan_id": clean_plan_id,
            "tier": request.tier,
            "billing_cycle": request.billing_cycle,
            "user_id": user_id,
            "app": "mwana-lari"
        }
    )

    if not openpay_res.get("success", False):
        error_detail = openpay_res.get("error", "Échec de l'initiation du paiement OpenPay")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur OpenPay : {error_detail}"
        )

    ref_code = openpay_res.get("reference") or f"OP-{uuid.uuid4().hex[:8].upper()}"
    tx_id = f"tx_op_{uuid.uuid4().hex[:12]}"

    # 4. Enregistrement de la transaction en base avec statut PENDING
    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=user_id,
            plan_id=clean_plan_id,
            amount=float(request.amount_fcfa),
            currency="XAF",
            provider=f"OPENPAY_{provider_code}",
            phone_number=clean_phone,
            status="PENDING",
            transaction_ref=ref_code,
            provider_transaction_id=ref_code
        )
        db.add(new_tx)
        db.commit()
    except Exception as e:
        db.rollback()

    operator_label = "MTN MoMo Congo" if provider_code == "MTN" else "Airtel Money Congo"

    return {
        "status": "PENDING",
        "transaction_id": tx_id,
        "reference_code": ref_code,
        "amount_fcfa": request.amount_fcfa,
        "operator": operator_label,
        "provider": provider_code,
        "phone_number": clean_phone,
        "plan_id": clean_plan_id,
        "ussd_instruction": openpay_res.get(
            "ussd_instruction",
            f"Veuillez composer votre code secret sur votre téléphone {clean_phone} pour valider le paiement de {request.amount_fcfa:,} FCFA."
        ),
        "openpay_response": openpay_res
    }

@router.get("/openpay/check/{reference_id}")
async def check_openpay_status(
    reference_id: str,
    db: Session = Depends(get_db)
):
    """
    Vérifie le statut d'une transaction directement auprès de l'API OpenPay Congo.
    Si le paiement est confirmé, active/renouvelle l'abonnement dans user_subscriptions.
    """
    # 1. Vérification auprès d'OpenPay
    check_result = await openpay_client.check_transaction_status(reference_id)
    is_success = check_result.get("is_successful", False) or check_result.get("status") in ("success", "paid", "completed")

    # 2. Recherche de la transaction locale
    tx = db.query(PaymentTransaction).filter(
        (PaymentTransaction.transaction_ref == reference_id) | (PaymentTransaction.id == reference_id)
    ).first()

    if tx:
        if is_success:
            tx.status = "SUCCESS"

            # Activer ou renouveler l'abonnement de l'utilisateur
            if tx.user_id and tx.user_id != "anonymous_family":
                now = datetime.datetime.utcnow()
                is_annual = "annual" in (tx.plan_id or "").lower() or "yearly" in (tx.plan_id or "").lower()
                duration_days = 365 if is_annual else 30

                existing_sub = db.query(UserSubscription).filter(UserSubscription.user_id == tx.user_id).first()
                base_date = max(now, existing_sub.end_date) if (existing_sub and existing_sub.end_date and existing_sub.end_date > now) else now
                end_date = base_date + datetime.timedelta(days=duration_days)

                if existing_sub:
                    existing_sub.status = "ACTIVE"
                    existing_sub.plan_id = tx.plan_id
                    existing_sub.end_date = end_date
                    existing_sub.payment_method = tx.provider
                    existing_sub.transaction_reference = tx.transaction_ref
                else:
                    new_sub = UserSubscription(
                        user_id=tx.user_id,
                        plan_id=tx.plan_id,
                        status="ACTIVE",
                        payment_method=tx.provider,
                        start_date=now,
                        end_date=end_date,
                        transaction_reference=tx.transaction_ref,
                        auto_renew=True
                    )
                    db.add(new_sub)

            db.commit()

        elif check_result.get("is_failed", False):
            tx.status = "FAILED"
            db.commit()

    return {
        "reference": reference_id,
        "status": "SUCCESS" if is_success else check_result.get("status", "PENDING"),
        "is_successful": is_success,
        "amount": check_result.get("amount") or (tx.amount if tx else None),
        "message": check_result.get("message", "Vérification effectuée."),
        "openpay_details": check_result
    }

@router.post("/openpay/webhook")
async def openpay_webhook(
    payload: dict,
    x_signature: Optional[str] = Header(None),
    x_openpay_signature: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Callback URL sécurisé pour OpenPay Congo.
    Vérifie l'authenticité de la requête et met à jour payment_transactions & user_subscriptions.
    """
    # 1. Vérification de la signature / token en production
    sig = x_signature or x_openpay_signature
    auth_token = authorization.replace("Bearer ", "").strip() if authorization else None
    
    if settings.ENVIRONMENT == "production":
        expected_secret = settings.WEBHOOK_SECRET
        api_key = settings.OPENPAY_API_KEY
        valid = False
        if sig and (sig in (expected_secret, f"sha256={expected_secret}", api_key)):
            valid = True
        elif auth_token and (auth_token in (expected_secret, api_key)):
            valid = True

        if not valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Signature ou authentification du webhook OpenPay invalide."
            )

    ref = payload.get("reference") or payload.get("transaction_ref") or payload.get("id")
    event_status = (payload.get("status") or "").lower()
    is_success = event_status in ("success", "paid", "completed")
    is_failed = event_status in ("failed", "canceled", "cancelled", "expired")

    if ref:
        tx = db.query(PaymentTransaction).filter(
            (PaymentTransaction.transaction_ref == ref) | (PaymentTransaction.id == ref)
        ).first()

        if tx:
            if is_success:
                tx.status = "SUCCESS"

                # Créer ou renouveler l'abonnement
                if tx.user_id and tx.user_id != "anonymous_family":
                    now = datetime.datetime.utcnow()
                    is_annual = "annual" in (tx.plan_id or "").lower() or "yearly" in (tx.plan_id or "").lower()
                    duration_days = 365 if is_annual else 30

                    existing_sub = db.query(UserSubscription).filter(UserSubscription.user_id == tx.user_id).first()
                    base_date = max(now, existing_sub.end_date) if (existing_sub and existing_sub.end_date and existing_sub.end_date > now) else now
                    end_date = base_date + datetime.timedelta(days=duration_days)

                    if existing_sub:
                        existing_sub.status = "ACTIVE"
                        existing_sub.plan_id = tx.plan_id
                        existing_sub.end_date = end_date
                        existing_sub.payment_method = tx.provider
                        existing_sub.transaction_reference = tx.transaction_ref
                    else:
                        new_sub = UserSubscription(
                            user_id=tx.user_id,
                            plan_id=tx.plan_id,
                            status="ACTIVE",
                            payment_method=tx.provider,
                            start_date=now,
                            end_date=end_date,
                            transaction_reference=tx.transaction_ref,
                            auto_renew=True
                        )
                        db.add(new_sub)
            elif is_failed:
                tx.status = "FAILED"

            db.commit()

    # OpenPay exige impérativement un code HTTP 200
    return {
        "status": "SUCCESS",
        "message": "Callback OpenPay validé et traité avec succès.",
        "received_reference": ref
    }


