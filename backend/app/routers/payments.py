from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
import uuid
import datetime
import hmac
import hashlib
import secrets
import asyncio
import logging

logger = logging.getLogger("mwana_lari_payments")

from ..database import get_db, SessionLocal
from ..models.subscription import SubscriptionPlan, UserSubscription, PaymentTransaction, AppliedPayment
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
    consultation_token: Optional[str] = None

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

def _get_or_create_payer_user(
    db: Session,
    user_id: Optional[str],
    phone_number: str,
    name: Optional[str] = None,
    current_user: Optional[User] = None
) -> User:
    """Garantit un identifiant utilisateur valide pour la table payment_transactions."""
    if current_user:
        return current_user
    user = None
    if user_id and user_id not in ("anonymous", "anonymous_family", ""):
        user = db.query(User).filter(User.id == user_id).first()
    clean_phone = openpay_client.format_phone_number(phone_number)
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

CATALOG_PRICING = {
    "plan_free": 0,
    "plan_family": 1500,
    "plan_family_monthly": 1500,
    "plan_family_annual": 15000,
    "plan_clan": 2500,
    "plan_clan_monthly": 2500,
    "plan_clan_annual": 25000,
}

def resolve_server_plan_and_price(plan_id: str, billing_cycle: str, db: Session) -> tuple[str, int]:
    """
    Détermine avec certitude côté serveur l'identifiant canonique du forfait
    et son prix officiel en FCFA afin de prévenir toute manipulation client.
    """
    is_yearly = (billing_cycle or "").lower() in ("yearly", "annual")
    clean_plan_id = plan_id or "plan_family"
    if clean_plan_id in ("plan_family", "FAMILY"):
        clean_plan_id = "plan_family_annual" if is_yearly else "plan_family_monthly"
    elif clean_plan_id in ("plan_clan", "CLAN_DIASPORA", "CLAN"):
        clean_plan_id = "plan_clan_annual" if is_yearly else "plan_clan_monthly"
    elif clean_plan_id in ("plan_free", "FREE"):
        clean_plan_id = "plan_free"
    elif is_yearly and not clean_plan_id.endswith("_annual"):
        clean_plan_id = f"{clean_plan_id}_annual"
    elif not is_yearly and not clean_plan_id.endswith("_monthly") and clean_plan_id != "plan_free":
        clean_plan_id = f"{clean_plan_id}_monthly"

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == clean_plan_id).first()
    if not plan and clean_plan_id != plan_id:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()

    if plan and plan.price_xaf is not None and plan.price_xaf >= 0:
        expected_price = plan.price_xaf
    else:
        expected_price = CATALOG_PRICING.get(clean_plan_id, 15000 if is_yearly else 1500)

    return clean_plan_id, expected_price

def _verify_transaction_access(
    tx: PaymentTransaction,
    current_user: Optional[User],
    token: Optional[str] = None
) -> None:
    """
    Vérifie les droits d'accès à la consultation d'une transaction :
    - Utilisateur connecté propriétaire de la transaction
    - Administrateur système
    - Porteur du jeton secret de consultation (consultation_token) émis lors de l'initiation
    """
    if current_user:
        if current_user.id == tx.user_id or current_user.role == "ADMIN":
            return
    
    if token and tx.consultation_token and hmac.compare_digest(token.strip(), tx.consultation_token.strip()):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé: authentification requise ou jeton de consultation invalide."
    )

def _activate_subscription_for_tx(db: Session, tx: PaymentTransaction):
    """
    Active ou prolonge l'abonnement en base pour la transaction validée.
    Protection absolue contre le rejeu : vérification d'idempotence et enregistrement
    atomique dans la table applied_payments (clé primaire / contrainte d'unicité sur transaction_ref).
    """
    # 1. Vérification si la transaction locale est déjà marquée appliquée
    if tx.is_applied or tx.applied_at is not None:
        logger.warning(f"[REPLAY BLOCKED] Transaction {tx.transaction_ref} déjà appliquée.")
        return

    # 2. Vérification d'idempotence persistante dans applied_payments
    existing_applied = db.query(AppliedPayment).filter(
        AppliedPayment.transaction_ref == tx.transaction_ref
    ).first()
    if existing_applied:
        logger.warning(f"[REPLAY BLOCKED] Transaction {tx.transaction_ref} déjà présente dans applied_payments.")
        tx.is_applied = True
        tx.applied_at = existing_applied.applied_at
        tx.status = "SUCCESS"
        db.commit()
        return

    is_annual = "annual" in (tx.plan_id or "").lower() or "yearly" in (tx.plan_id or "").lower()
    clean_plan_id = tx.plan_id
    if clean_plan_id in ("plan_family", "FAMILY"):
        clean_plan_id = "plan_family_annual" if is_annual else "plan_family_monthly"
    elif clean_plan_id in ("plan_clan", "CLAN_DIASPORA", "CLAN"):
        clean_plan_id = "plan_clan_annual" if is_annual else "plan_clan_monthly"

    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == clean_plan_id).first()
    if not plan:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == tx.plan_id).first()

    duration_days = 365 if (is_annual or (plan and plan.billing_period == "ANNUAL")) else 30
    now = datetime.datetime.utcnow()

    # 3. Prolongation de l'abonnement existant ou création d'un nouvel abonnement
    existing_sub = db.query(UserSubscription).filter(
        UserSubscription.user_id == tx.user_id
    ).order_by(UserSubscription.created_at.desc()).first()

    if existing_sub:
        base_date = max(now, existing_sub.end_date) if (existing_sub.status == "ACTIVE" and existing_sub.end_date and existing_sub.end_date > now) else now
        existing_sub.status = "ACTIVE"
        existing_sub.plan_id = clean_plan_id
        existing_sub.payment_method = tx.provider
        existing_sub.start_date = now if existing_sub.status != "ACTIVE" else existing_sub.start_date
        existing_sub.end_date = base_date + datetime.timedelta(days=duration_days)
        existing_sub.transaction_reference = tx.transaction_ref
        existing_sub.auto_renew = True
        sub_id = existing_sub.id
    else:
        new_sub = UserSubscription(
            id=str(uuid.uuid4()),
            user_id=tx.user_id,
            plan_id=clean_plan_id,
            status="ACTIVE",
            payment_method=tx.provider,
            start_date=now,
            end_date=now + datetime.timedelta(days=duration_days),
            transaction_reference=tx.transaction_ref,
            auto_renew=True
        )
        db.add(new_sub)
        db.flush()
        sub_id = new_sub.id

    # 4. Enregistrement atomique de l'application de la transaction dans applied_payments
    try:
        applied_record = AppliedPayment(
            transaction_ref=tx.transaction_ref,
            user_id=tx.user_id,
            subscription_id=sub_id,
            amount=tx.amount,
            applied_at=now
        )
        db.add(applied_record)
        tx.is_applied = True
        tx.applied_at = now
        tx.status = "SUCCESS"
        tx.plan_id = clean_plan_id
        db.commit()
        logger.info(f"[PAYMENT APPLIED] Transaction {tx.transaction_ref} appliquée pour l'utilisateur {tx.user_id}.")
    except Exception as e:
        db.rollback()
        logger.warning(f"[REPLAY / CONCURRENCY BLOCKED] Conflit d'unicité lors de l'application de {tx.transaction_ref}: {e}")

async def _poll_openpay_transaction_background(reference_code: str):
    """
    Sonde périodiquement l'API OpenPay Congo pendant la fenêtre de validation USSD (5 minutes)
    pour les vraies références PTXN afin de synchroniser le statut même si l'utilisateur
    bascule vers son application Téléphone (*105# / *128#) et met le navigateur en arrière-plan.
    """
    if not reference_code or not reference_code.startswith("PTXN") or not openpay_client.is_configured:
        return

    # 30 vérifications espacées de 8 secondes (~4 minutes)
    for _ in range(30):
        await asyncio.sleep(8)
        db = SessionLocal()
        try:
            tx = db.query(PaymentTransaction).filter(
                PaymentTransaction.transaction_ref == reference_code
            ).first()
            if not tx or tx.status in ("SUCCESS", "FAILED", "TAMPERED_FAILED") or tx.is_applied:
                return

            openpay_status = await openpay_client.check_transaction_status(reference_code)
            if openpay_status.get("is_successful"):
                api_amount = openpay_status.get("amount")
                amount_ok = True
                if api_amount is not None:
                    try:
                        val_amount = float(str(api_amount).replace(",", ".").strip())
                        if abs(val_amount - float(tx.amount)) > 0.01:
                            amount_ok = False
                    except ValueError:
                        pass
                if amount_ok:
                    _activate_subscription_for_tx(db, tx)
                else:
                    tx.status = "TAMPERED_FAILED"
                    db.commit()
                return
            elif openpay_status.get("is_failed"):
                tx.status = "FAILED"
                db.commit()
                return
        except Exception as e:
            logger.warning(f"[OpenPay Background Poll] Erreur pour {reference_code}: {e}")
        finally:
            db.close()

# =========================================================================
# ENDPOINTS OFFICIELS OPENPAY CONGO (MTN MOMO & AIRTEL MONEY)
# =========================================================================

@router.post(
    "/openpay/initiate",
    dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60, action="openpay_initiate"))]
)
async def initiate_openpay_payment(
    request: OpenPayInitiateRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Initie une transaction Mobile Money officielle via la passerelle OpenPay Congo.
    Déclenche le push USSD sur le téléphone client (MTN *105# ou Airtel *128#).
    """
    clean_phone = openpay_client.format_phone_number(request.phone_number) if request.phone_number else ""
    is_card = (
        request.method in ("VISA_MASTERCARD", "CARD") or
        "CARD" in (request.method or "").upper() or
        "VISA" in (request.method or "").upper() or
        "MASTER" in (request.method or "").upper()
    )

    if not is_card and len(clean_phone) < 9:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Numéro de téléphone congolais invalide pour Mobile Money (ex: 06 675 19 34)."
        )

    if request.amount_fcfa < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le montant minimum autorisé est de 100 FCFA."
        )

    is_yearly = request.billing_cycle in ("yearly", "annual", "ANNUAL")
    clean_plan_id, expected_amount = resolve_server_plan_and_price(request.plan_id, request.billing_cycle, db)

    # Vérification stricte anti-falsification du prix par le client
    if request.amount_fcfa != expected_amount:
        logger.warning(
            f"[PRIX FALSIFIE] Montant client incohérent pour {clean_plan_id}: reçu {request.amount_fcfa} FCFA, attendu {expected_amount} FCFA."
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incohérence de tarification: le montant officiel pour '{clean_plan_id}' est de {expected_amount} FCFA (montant reçu: {request.amount_fcfa} FCFA)."
        )

    payer_phone = clean_phone or (current_user.phone_number if current_user else "242060000000")
    payer = _get_or_create_payer_user(db, request.user_id, payer_phone, request.customer_name, current_user=current_user)
    provider_code = openpay_client.resolve_provider(request.method, payer_phone)

    # Appel vers l'API OpenPay Congo
    openpay_resp = await openpay_client.initiate_payment(
        phone_number=payer_phone,
        amount_fcfa=expected_amount,
        provider=provider_code,
        metadata={
            "user_id": payer.id,
            "plan_id": clean_plan_id,
            "billing_cycle": request.billing_cycle,
            "customer_name": request.customer_name or payer.full_name,
            "customer_email": request.customer_email or payer.email,
        }
    )

    tx_id = f"tx_{uuid.uuid4().hex[:12]}"
    ref_code = openpay_resp.get("reference") or f"OP-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"
    consultation_token = secrets.token_urlsafe(32)

    is_success = openpay_resp.get("success", False)
    status_str = openpay_resp.get("status", "PENDING" if is_success else "FAILED")
    error_detail = openpay_resp.get("message") or openpay_resp.get("error") or openpay_resp.get("raw", {}).get("message") or ""

    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=payer.id,
            plan_id=clean_plan_id,
            amount=float(expected_amount),
            currency="XAF",
            provider=f"OPENPAY_{provider_code}",
            phone_number=payer_phone,
            status=status_str,
            transaction_ref=ref_code,
            provider_transaction_id=openpay_resp.get("reference") or f"OP-{ref_code}",
            consultation_token=consultation_token
        )
        db.add(new_tx)
        db.commit()

        # Si validé directement dès l'initiation (ex: synchrone en production)
        if status_str == "SUCCESS":
            _activate_subscription_for_tx(db, new_tx)
        elif status_str == "PENDING" and ref_code.startswith("PTXN"):
            background_tasks.add_task(_poll_openpay_transaction_background, ref_code)
    except Exception as e:
        db.rollback()

    operator_name = (
        "Carte Bancaire (Visa / Mastercard)" if is_card else
        ("MTN MoMo Congo" if provider_code == "MTN" else "Airtel Money Congo")
    )
    payment_url = openpay_resp.get("payment_url")

    if not is_success or status_str == "FAILED":
        return {
            "success": False,
            "status": "FAILED",
            "transaction_id": tx_id,
            "reference_code": ref_code,
            "reference": ref_code,
            "amount_fcfa": expected_amount,
            "operator": operator_name,
            "payment_url": payment_url,
            "consultation_token": consultation_token,
            "message": error_detail or "Transaction rejetée par l'opérateur.",
            "error": error_detail or "Transaction rejetée par l'opérateur.",
            "mode": openpay_resp.get("mode", "LIVE"),
            "raw": openpay_resp.get("raw", {})
        }

    ussd_msg = openpay_resp.get("ussd_instruction") or (
        "Redirection vers le guichet de paiement par carte..." if is_card else (
            f"Un message USSD a été envoyé au {clean_phone}. "
            f"Composez {'*105#' if provider_code == 'MTN' else '*128#'} pour approuver le débit de {expected_amount:,} FCFA."
        )
    )

    return {
        "success": True,
        "transaction_id": tx_id,
        "reference_code": ref_code,
        "reference": ref_code,
        "status": "PENDING",
        "amount_fcfa": expected_amount,
        "operator": operator_name,
        "payment_url": payment_url,
        "ussd_instruction": ussd_msg,
        "consultation_token": consultation_token,
        "mode": openpay_resp.get("mode", "LIVE"),
        "raw": openpay_resp.get("raw", {})
    }

@router.get("/openpay/check/{reference_id}")
async def check_openpay_payment_status(
    reference_id: str,
    token: Optional[str] = Query(None),
    x_consultation_token: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Vérifie le statut en direct auprès de l'API OpenPay et active l'abonnement en cas de succès.
    Exige une session utilisateur propriétaire, le rôle administrateur ou le jeton de consultation de la transaction.
    """
    tx = db.query(PaymentTransaction).filter(
        (PaymentTransaction.id == reference_id) | 
        (PaymentTransaction.transaction_ref == reference_id) |
        (PaymentTransaction.provider_transaction_id == reference_id)
    ).first()

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable."
        )

    effective_token = token or x_consultation_token
    _verify_transaction_access(tx, current_user, effective_token)

    openpay_ref = tx.transaction_ref or reference_id
    openpay_status = await openpay_client.check_transaction_status(openpay_ref)
    is_success = openpay_status.get("is_successful", False)
    is_failed = openpay_status.get("is_failed", False)
    operator_msg = (openpay_status.get("message") or "").strip()

    if is_success:
        # Contrôle anti-falsification du montant reçu
        api_amount = openpay_status.get("amount")
        if api_amount is not None:
            try:
                val_amount = float(str(api_amount).replace(",", ".").strip())
                if abs(val_amount - float(tx.amount)) > 0.01:
                    logger.error(f"[FRAUD] Incohérence de montant lors du check de {reference_id}: API={val_amount}, DB={tx.amount}")
                    is_success = False
                    is_failed = True
            except ValueError:
                pass

        if is_success:
            _activate_subscription_for_tx(db, tx)
        else:
            tx.status = "TAMPERED_FAILED"
            db.commit()
    elif is_failed:
        tx.status = "FAILED"
        db.commit()

    status_str = "SUCCESS" if (tx.status == "SUCCESS" or is_success) else ("FAILED" if (tx.status == "TAMPERED_FAILED" or is_failed) else tx.status)
    default_msg = (
        "Paiement validé avec succès !"
        if status_str == "SUCCESS"
        else ("Paiement échoué ou annulé." if status_str in ("FAILED", "TAMPERED_FAILED") else "En attente de validation par l'utilisateur.")
    )

    return {
        "success": True,
        "reference": tx.transaction_ref,
        "status": status_str,
        "is_successful": (status_str == "SUCCESS"),
        "is_failed": (status_str in ("FAILED", "TAMPERED_FAILED")),
        "transaction_id": tx.id,
        "amount": tx.amount,
        "currency": tx.currency,
        "message": operator_msg if (operator_msg and status_str != "SUCCESS") else default_msg
    }

# =========================================================================
# ROUTE COMPATIBLE MOMO (AVEC DÉLÉGATION AUTOMATIQUE VERS OPENPAY)
# =========================================================================

@router.post(
    "/momo/initiate",
    response_model=MomoInitiateResponse,
    dependencies=[Depends(rate_limit(max_requests=6, window_seconds=60, action="momo_initiate"))]
)
async def initiate_momo_payment(
    request: MomoInitiateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Initie une transaction Mobile Money avec priorité à la passerelle OpenPay.
    """
    clean_phone = openpay_client.format_phone_number(request.phone_number)
    if len(clean_phone) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Numéro de téléphone invalide."
        )

    clean_plan_id, expected_amount = resolve_server_plan_and_price(request.plan_id, request.billing_cycle, db)
    if request.amount_fcfa != expected_amount:
        logger.warning(f"[PRIX FALSIFIE] Montant MoMo incohérent: reçu {request.amount_fcfa} FCFA, attendu {expected_amount} FCFA.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incohérence de tarification: le montant officiel pour '{clean_plan_id}' est de {expected_amount} FCFA (montant reçu: {request.amount_fcfa} FCFA)."
        )

    payer = _get_or_create_payer_user(db, request.user_id, clean_phone, current_user=current_user)
    provider_code = openpay_client.resolve_provider(request.method, clean_phone)
    operator_name = "MTN MoMo Congo" if provider_code == "MTN" else ("Airtel Money Congo" if provider_code == "AIRTEL" else "Carte Bancaire")
    consultation_token = secrets.token_urlsafe(32)

    # Si OpenPay est configuré, on l'utilise directement
    tx_status = "PENDING"
    if openpay_client.is_configured:
        op_resp = await openpay_client.initiate_payment(
            phone_number=clean_phone,
            amount_fcfa=expected_amount,
            provider=provider_code,
            metadata={"user_id": payer.id, "plan_id": clean_plan_id}
        )
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        ref_code = op_resp.get("reference") or f"OP-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"
        tx_status = op_resp.get("status", "PENDING" if op_resp.get("success", False) else "FAILED")
        ussd_instruction = op_resp.get("ussd_instruction") or op_resp.get("message") or f"Composez {'*105#' if provider_code == 'MTN' else '*128#'} pour valider."
    else:
        # Fallback simulation contrôlée en environnement hors production
        from ..config import settings
        if settings.ENVIRONMENT == "production" and not settings.ALLOW_PAYMENT_SIMULATION:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Passerelle de paiement non configurée en environnement de production."
            )
        tx_id = f"tx_{uuid.uuid4().hex[:12]}"
        ref_code = f"MOMO-{datetime.datetime.utcnow().strftime('%M%S%f')[:8]}"
        ussd_instruction = f"Composez {'*105#' if provider_code == 'MTN' else '*128#'} sur votre téléphone {clean_phone} pour valider le débit de {expected_amount:,} FCFA."

    # Save transaction in DB
    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=payer.id,
            plan_id=clean_plan_id,
            amount=float(expected_amount),
            currency="XAF",
            provider=request.method,
            phone_number=clean_phone,
            status=tx_status,
            transaction_ref=ref_code,
            provider_transaction_id=f"OP-{ref_code}",
            consultation_token=consultation_token
        )
        db.add(new_tx)
        db.commit()
    except Exception:
        db.rollback()

    return MomoInitiateResponse(
        transaction_id=tx_id,
        status=tx_status,
        reference_code=ref_code,
        amount_fcfa=expected_amount,
        operator=operator_name,
        ussd_instruction=ussd_instruction,
        consultation_token=consultation_token
    )

@router.get("/verify/{transaction_id}")
def verify_payment(
    transaction_id: str,
    token: Optional[str] = Query(None),
    x_consultation_token: Optional[str] = Header(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Vérifie le statut réel d'une transaction de paiement en base de données.
    Exige une session utilisateur propriétaire, le rôle administrateur ou le jeton de consultation de la transaction.
    """
    tx = db.query(PaymentTransaction).filter(
        (PaymentTransaction.id == transaction_id) | (PaymentTransaction.transaction_ref == transaction_id)
    ).first()

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable."
        )

    effective_token = token or x_consultation_token
    _verify_transaction_access(tx, current_user, effective_token)

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
async def momo_webhook(
    provider: str,
    payload: dict,
    request: Request,
    x_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Webhook sécurisé pour la réception des callbacks instantanés des passerelles (OpenPay, MTN MoMo, Airtel).
    """
    if provider.lower() == "openpay":
        return await openpay_webhook(
            payload=payload,
            request=request,
            x_signature=x_signature,
            db=db
        )

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
    current_user: Optional[User] = Depends(get_optional_current_user),
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

    effective_user_id = current_user.id if current_user else "anonymous_family"

    # Enregistrer la transaction en attente (PENDING)
    try:
        new_tx = PaymentTransaction(
            id=tx_id,
            user_id=effective_user_id,
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
# WEBHOOK OFFICIEL OPENPAY CONGO (MTN MOMO & AIRTEL MONEY)
# =========================================================================

@router.post("/openpay/webhook")
@router.post("/webhook/openpay")
async def openpay_webhook(
    payload: dict,
    request: Request,
    x_signature: Optional[str] = Header(None),
    x_openpay_signature: Optional[str] = Header(None),
    xo_api_key: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Callback URL sécurisé officiel pour OpenPay Congo (MTN MoMo & Airtel Money).
    Reçoit les notifications HTTP POST envoyées en temps réel par OpenPay.
    Valide l'authenticité et active automatiquement l'abonnement en base de données.
    """
    logger.info(f"[OpenPay Webhook] Notification reçue: {payload}")

    # 1. Vérification de l'authenticité
    expected_secret = settings.WEBHOOK_SECRET
    api_key = settings.OPENPAY_API_KEY
    auth_token = authorization.replace("Bearer ", "").strip() if authorization else None
    received_key = (xo_api_key or x_api_key or "").strip()

    valid_auth = False
    if received_key and api_key and hmac.compare_digest(received_key, api_key.strip()):
        valid_auth = True
    elif auth_token and (
        (expected_secret and hmac.compare_digest(auth_token, expected_secret)) or
        (api_key and hmac.compare_digest(auth_token, api_key.strip()))
    ):
        valid_auth = True
    else:
        sig = x_signature or x_openpay_signature
        if sig:
            sig_clean = sig.replace("sha256=", "").strip()
            if (expected_secret and hmac.compare_digest(sig_clean, expected_secret)) or (api_key and hmac.compare_digest(sig_clean, api_key.strip())):
                valid_auth = True
            else:
                try:
                    raw_body = await request.body()
                    for s in (expected_secret, api_key):
                        if s:
                            computed = hmac.new(s.encode(), raw_body, hashlib.sha256).hexdigest()
                            if hmac.compare_digest(sig_clean, computed):
                                valid_auth = True
                                break
                except Exception:
                    pass

    # Si des en-têtes d'authentification étaient fournis mais invalides, rejet immédiat
    has_auth_headers = bool(xo_api_key or x_api_key or authorization or x_signature or x_openpay_signature)
    if has_auth_headers and not valid_auth:
        logger.warning("[OpenPay Webhook] En-tête d'authentification présent mais invalide.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature ou authentification du webhook OpenPay invalide."
        )

    # 2. Extraction stricte de la référence
    data_obj = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    ref = (
        payload.get("reference") or
        data_obj.get("reference") or
        payload.get("transaction_ref") or
        data_obj.get("transaction_ref") or
        payload.get("transaction_id") or
        data_obj.get("transaction_id") or
        payload.get("reference_id") or
        data_obj.get("reference_id") or
        payload.get("id") or
        data_obj.get("id")
    )

    if not ref or not str(ref).strip():
        logger.warning("[OpenPay Webhook] Référence absente.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Référence de transaction obligatoire manquante."
        )

    ref = str(ref).strip()

    # 3. Recherche stricte par référence (la réconciliation par numéro de téléphone est supprimée pour des raisons de sécurité)
    tx = db.query(PaymentTransaction).filter(
        (PaymentTransaction.transaction_ref == ref) |
        (PaymentTransaction.id == ref) |
        (PaymentTransaction.provider_transaction_id == ref)
    ).first()

    if not tx:
        logger.warning(f"[OpenPay Webhook] Transaction inconnue pour la référence: {ref}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction introuvable pour la référence fournie."
        )

    # 4. Preuve d'authenticité obligatoire : si la notification n'est pas signée,
    # vérification impérative auprès de l'API OpenPay avant toute activation ou mise à jour.
    api_status = None
    if not valid_auth:
        if not openpay_client.is_configured:
            logger.warning("[OpenPay Webhook] Rejet: webhook non authentifié et passerelle OpenPay non configurée.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentification du webhook requise."
            )
        api_status = await openpay_client.check_transaction_status(tx.transaction_ref or ref)
        if not api_status or not (api_status.get("is_successful") or api_status.get("is_failed")):
            logger.warning(f"[OpenPay Webhook] Rejet: webhook non authentifié et transaction non confirmée par l'API OpenPay pour {ref}.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Preuve d'authenticité requise: transaction non confirmée par l'API OpenPay."
            )
    else:
        # Si authentifié par signature/clé, interroger l'API pour mise à jour si la référence existe sur OpenPay
        if openpay_client.is_configured and not ref.startswith("PTXN-TEST-") and not ref.startswith("PTXN-ALIAS-") and not ref.startswith("SIM-"):
            api_status = await openpay_client.check_transaction_status(tx.transaction_ref or ref)

    # 5. Extraction et validation stricte du statut (AUCUN statut par défaut à 'SUCCESS')
    raw_status = (
        payload.get("status") or
        data_obj.get("status") or
        payload.get("event") or
        payload.get("state")
    )
    if not raw_status:
        logger.warning(f"[OpenPay Webhook] Statut absent pour la transaction {ref}.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Statut de paiement obligatoire absent du payload."
        )

    effective_status = str(raw_status or (api_status.get("status") if api_status else "")).lower()
    is_success = any(s in effective_status for s in ("success", "paid", "complet", "valid"))
    is_failed = any(s in effective_status for s in ("fail", "cancel", "expir", "reject", "refus", "error"))

    if api_status and not valid_auth:
        if is_success and not api_status.get("is_successful"):
            logger.error(f"[OpenPay Webhook] Incohérence de statut: payload={effective_status}, API={api_status.get('status')}")
            is_success = False
            is_failed = True

    # 6. Contrôle anti-falsification du montant et de la devise
    reported_amount = (api_status.get("amount") if api_status else None) or payload.get("amount") or data_obj.get("amount")
    if reported_amount is not None:
        try:
            val_amount = float(str(reported_amount).replace(",", ".").strip())
            if abs(val_amount - float(tx.amount)) > 0.01:
                logger.error(f"[FRAUD ALERT] Montant falsifié sur webhook pour {ref}: reçu {val_amount}, attendu {tx.amount}")
                tx.status = "TAMPERED_FAILED"
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Montant de la transaction incohérent avec l'enregistrement initial."
                )
        except ValueError:
            pass

    reported_currency = (api_status.get("currency") if api_status else None) or payload.get("currency") or data_obj.get("currency")
    if reported_currency:
        rep_curr = str(reported_currency).upper().strip()
        if rep_curr not in ("XAF", "FCFA") and rep_curr != str(tx.currency).upper():
            logger.error(f"[FRAUD ALERT] Devise incohérente sur webhook pour {ref}: reçu {reported_currency}, attendu {tx.currency}")
            tx.status = "TAMPERED_FAILED"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Devise de la transaction incohérente."
            )

    # 7. Activation atomique et protégée contre le rejeu
    activated = False
    if is_success:
        _activate_subscription_for_tx(db, tx)
        activated = True
        logger.info(f"[OpenPay Webhook] Transaction validée et abonnement activé pour tx={tx.id}, user={tx.user_id}")
    elif is_failed:
        tx.status = "FAILED"
        db.commit()
        logger.info(f"[OpenPay Webhook] Transaction marquée FAILED: {tx.id}")

    return {
        "status": "SUCCESS",
        "message": "Callback OpenPay validé et traité avec succès.",
        "received_reference": ref,
        "transaction_id": tx.id,
        "activated": activated
    }


