import os
import re
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("mwana_lari_openpay")

def _load_settings():
    try:
        from ..config import settings
        return settings.OPENPAY_API_KEY, settings.OPENPAY_BASE_URL
    except Exception:
        return os.getenv("OPENPAY_API_KEY", ""), os.getenv("OPENPAY_BASE_URL", "https://api.openpay-cg.com/v1")

class OpenPayClient:
    """
    Client d'intégration officiel pour la passerelle OpenPay Congo (MTN MoMo & Airtel Money).
    Documentation API: https://api.openpay-cg.com/v1
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        cfg_key, cfg_url = _load_settings()
        self.api_key = (api_key or cfg_key or os.getenv("OPENPAY_API_KEY", "")).strip()
        self.base_url = (base_url or cfg_url or os.getenv("OPENPAY_BASE_URL", "https://api.openpay-cg.com/v1")).rstrip("/")

    @property
    def is_configured(self) -> bool:
        """Vérifie si la clé API OpenPay est renseignée."""
        return bool(self.api_key and self.api_key.strip())

    def format_phone_number(self, phone: str) -> str:
        """
        Nettoie et normalise le numéro de téléphone au format attendu par OpenPay Congo :
        Exemple : 242061234567 ou 242051234567
        """
        digits = re.sub(r"\D", "", phone or "")
        
        # Si commence par 00242
        if digits.startswith("00242"):
            digits = digits[2:]
        # Si commence par 242
        if digits.startswith("242"):
            return digits
        # Si commence par 06, 05, 04 (numéro local à 9 chiffres ex: 06 123 45 67)
        if digits.startswith("0") and len(digits) == 9:
            return f"242{digits}"
        # Si 8 chiffres sans le 0 (ex: 61234567)
        if len(digits) == 8 and digits[0] in ("4", "5", "6"):
            return f"2420{digits}"
        
        # Défaut : préfixe 242 si non présent
        return f"242{digits}" if not digits.startswith("242") else digits

    def resolve_provider(self, method: str, phone: str) -> str:
        """Détermine le provider OpenPay ('MTN' ou 'AIRTEL')."""
        method_upper = (method or "").upper()
        if "AIRTEL" in method_upper:
            return "AIRTEL"
        if "MTN" in method_upper or "MOMO" in method_upper:
            return "MTN"
        
        # Détection par préfixe si méthode générique
        clean_phone = self.format_phone_number(phone)
        # 24206... = MTN, 24205... / 24204... = Airtel
        if clean_phone.startswith("24205") or clean_phone.startswith("24204"):
            return "AIRTEL"
        return "MTN"

    async def initiate_payment(
        self,
        phone_number: str,
        amount_fcfa: int,
        provider: str = "MTN",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Initie un paiement Mobile Money auprès de l'API OpenPay Congo.
        Endpoint: POST https://api.openpay-cg.com/v1/transaction/payment
        """
        clean_phone = self.format_phone_number(phone_number)
        provider_code = self.resolve_provider(provider, clean_phone)

        # Fallback simulation si clé non encore configurée
        if not self.is_configured:
            logger.warning("[OpenPay] Clé API non configurée. Bascule en mode simulation contrôlée.")
            sim_ref = f"SIM-OP-{clean_phone[-4:]}-{amount_fcfa}"
            return {
                "success": True,
                "mode": "SIMULATION",
                "reference": sim_ref,
                "status": "pending",
                "amount": str(amount_fcfa),
                "provider": provider_code,
                "payment_phone_number": clean_phone,
                "message": "Demande de paiement simulée avec succès.",
                "ussd_instruction": f"Veuillez valider le débit de {amount_fcfa:,} FCFA sur votre téléphone {clean_phone} ({provider_code})."
            }

        url = f"{self.base_url}/transaction/payment"
        headers = {
            "XO-API-KEY": self.api_key.strip(),
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Identifiant client externe obligatoire exigé par OpenPay
        ext_client_id = (metadata.get("user_id") if metadata else None)
        if not ext_client_id or ext_client_id in ("anonymous", "anonymous_family"):
            ext_client_id = f"parent_{clean_phone[-8:]}"

        payload = {
            "amount": int(amount_fcfa),
            "payment_phone_number": clean_phone,
            "provider": provider_code,
            "customer_external_id": str(ext_client_id)
        }
        if metadata:
            payload["metadata"] = metadata

        logger.info(f"[OpenPay] Envoi requête paiement: {url} | Provider: {provider_code} | Tel: {clean_phone} | Montant: {amount_fcfa}")

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload)
                data = response.json() if response.text else {}
                
                if response.status_code in (200, 201):
                    ref = data.get("reference") or data.get("transaction_id") or data.get("id")
                    status_val = (data.get("status") or "pending").lower()
                    is_failed = status_val in ("failed", "rejected", "error", "cancelled")
                    msg = data.get("message") or ("Demande envoyée sur votre téléphone." if not is_failed else "Paiement refusé par l'opérateur.")
                    
                    logger.info(f"[OpenPay] Réponse initiation: ref={ref} status={status_val} is_failed={is_failed} msg={msg}")
                    return {
                        "success": not is_failed,
                        "mode": "LIVE",
                        "reference": ref,
                        "status": "FAILED" if is_failed else ("SUCCESS" if status_val in ("success", "successful") else "PENDING"),
                        "amount": data.get("amount", str(amount_fcfa)),
                        "provider": provider_code,
                        "payment_phone_number": clean_phone,
                        "message": msg,
                        "error": msg if is_failed else None,
                        "ussd_instruction": (
                            f"Un message USSD a été envoyé au {phone_number}. "
                            f"Veuillez composer votre code secret {'MTN (*105#)' if provider_code == 'MTN' else 'Airtel (*128#)'} pour confirmer."
                        ) if not is_failed else msg,
                        "raw": data
                    }
                else:
                    error_msg = data.get("error") or data.get("message") or f"Erreur HTTP {response.status_code}"
                    logger.error(f"[OpenPay] Échec initiation ({response.status_code}): {error_msg}")
                    return {
                        "success": False,
                        "code": response.status_code,
                        "error": error_msg,
                        "raw": data
                    }

            except httpx.RequestError as e:
                logger.error(f"[OpenPay] Erreur réseau lors de l'appel OpenPay: {e}")
                return {
                    "success": False,
                    "code": 500,
                    "error": f"Impossible de contacter la passerelle OpenPay: {str(e)}"
                }

    async def check_transaction_status(self, reference_id: str) -> Dict[str, Any]:
        """
        Vérifie le statut d'une transaction via l'endpoint officiel OpenPay :
        GET https://api.openpay-cg.com/v1/transaction/status/:referenceId
        """
        if not self.is_configured:
            logger.warning("[OpenPay] Clé API non configurée.")
            return {
                "success": False,
                "reference": reference_id,
                "status": "pending",
                "is_successful": False,
                "is_failed": False,
                "message": "Passerelle OpenPay non configurée (clé manquante)."
            }
        
        if reference_id.startswith("SIM-"):
            return {
                "success": True,
                "reference": reference_id,
                "status": "pending",
                "is_successful": False,
                "is_failed": False,
                "message": "Transaction de simulation en attente de validation."
            }

        url = f"{self.base_url}/transaction/status/{reference_id}"
        headers = {
            "XO-API-KEY": self.api_key.strip(),
            "Accept": "application/json"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url, headers=headers)
                data = response.json() if response.text else {}

                if response.status_code == 200:
                    status_val = (data.get("status") or "").lower()
                    is_successful = status_val in ("success", "successful", "paid", "completed")
                    is_failed = status_val in ("failed", "canceled", "cancelled", "expired")
                    
                    return {
                        "success": True,
                        "reference": data.get("reference", reference_id),
                        "status": status_val,
                        "is_successful": is_successful,
                        "is_failed": is_failed,
                        "amount": data.get("amount"),
                        "currency": data.get("currency", "XAF"),
                        "provider": data.get("provider"),
                        "message": data.get("message", ""),
                        "raw": data
                    }
                else:
                    err_msg = data.get("error") or data.get("message") or f"Statut HTTP {response.status_code}"
                    return {
                        "success": False,
                        "reference": reference_id,
                        "status": "unknown",
                        "error": err_msg
                    }

            except Exception as e:
                logger.error(f"[OpenPay] Exception lors de la vérification du statut: {e}")
                return {
                    "success": False,
                    "reference": reference_id,
                    "status": "error",
                    "error": str(e)
                }

# Instance singleton prête à l'emploi
openpay_client = OpenPayClient()
