import os
import uuid
import base64
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("mwana_lari_payments")

# =====================================================================
# 1. CLIENT MTN MOBILE MONEY (MTN MOMO OPEN API - CONGO XAF)
# =====================================================================

class MtnMomoClient:
    """
    Client direct pour l'API MTN Mobile Money Open API (Collection API).
    Doc: https://momodeveloper.mtn.com/
    """
    def __init__(self):
        self.base_url = os.getenv("MTN_MOMO_BASE_URL", "https://sandbox.momodeveloper.mtn.com")
        self.primary_key = os.getenv("MTN_MOMO_SUBSCRIPTION_KEY", "your_subscription_key")
        self.api_user = os.getenv("MTN_MOMO_API_USER", "")
        self.api_key = os.getenv("MTN_MOMO_API_KEY", "")
        self.target_env = os.getenv("MTN_MOMO_TARGET_ENV", "sandbox")  # 'sandbox' ou 'mtncongo' (prod)

    def _get_auth_header(self) -> str:
        credentials = f"{self.api_user}:{self.api_key}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    async def get_access_token(self) -> Optional[str]:
        """Génère un Bearer Token valide auprès de MTN MoMo."""
        if not self.api_user or not self.api_key:
            logger.warning("[MTN MoMo] Clés API non configurées. Mode simulation actif.")
            return None

        url = f"{self.base_url}/collection/token/"
        headers = {
            "Authorization": self._get_auth_header(),
            "Ocp-Apim-Subscription-Key": self.primary_key,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, headers=headers)
                if response.status_code == 200:
                    return response.json().get("access_token")
                logger.error(f"[MTN MoMo] Échec Auth Token ({response.status_code}): {response.text}")
            except Exception as e:
                logger.error(f"[MTN MoMo] Exception Auth Token: {e}")
        return None

    async def request_to_pay(self, phone_number: str, amount_fcfa: int, reference_id: str) -> Dict[str, Any]:
        """
        Déclenche une invite de paiement USSD (*105#) sur le téléphone de l'utilisateur MTN.
        """
        token = await self.get_access_token()
        if not token:
            # Mode simulation si les clés réelles ne sont pas encore renseignées dans le .env
            return {
                "success": True,
                "mode": "SIMULATION",
                "reference_id": reference_id,
                "status": "PENDING",
                "operator": "MTN MoMo Congo",
                "ussd_instruction": f"Composez *105# pour valider le paiement de {amount_fcfa:,} FCFA."
            }

        # Nettoyage du numéro au format international (24206XXXXXXX)
        clean_phone = phone_number.replace("+", "").replace(" ", "")
        if not clean_phone.startswith("242"):
            clean_phone = f"242{clean_phone}"

        url = f"{self.base_url}/collection/v1_0/requesttopay"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Reference-Id": reference_id,
            "X-Target-Environment": self.target_env,
            "Ocp-Apim-Subscription-Key": self.primary_key,
            "Content-Type": "application/json"
        }
        body = {
            "amount": str(amount_fcfa),
            "currency": "XAF",
            "externalId": reference_id,
            "payer": {
                "partyIdType": "MSISDN",
                "partyId": clean_phone
            },
            "payerMessage": "Abonnement Mwana Lari",
            "payeeNote": "Paiement Mwana Lari"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, headers=headers, json=body)
                if response.status_code == 202:
                    return {
                        "success": True,
                        "mode": "LIVE",
                        "reference_id": reference_id,
                        "status": "PENDING",
                        "operator": "MTN MoMo Congo",
                        "ussd_instruction": f"Une notification USSD a été envoyée au {phone_number}. Composez *105# pour valider votre code PIN."
                    }
                logger.error(f"[MTN MoMo] Erreur RequestToPay ({response.status_code}): {response.text}")
                return {"success": False, "error": response.text}
            except Exception as e:
                logger.error(f"[MTN MoMo] Exception RequestToPay: {e}")
                return {"success": False, "error": str(e)}

    async def get_transaction_status(self, reference_id: str) -> Dict[str, Any]:
        """Vérifie le statut d'une transaction de paiement MTN MoMo."""
        token = await self.get_access_token()
        if not token:
            return {"status": "SUCCESS", "message": "Transaction simulée avec succès"}

        url = f"{self.base_url}/collection/v1_0/requesttopay/{reference_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Target-Environment": self.target_env,
            "Ocp-Apim-Subscription-Key": self.primary_key
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    # Statuts MTN MoMo: PENDING, SUCCESSFUL, FAILED
                    mtn_status = data.get("status", "PENDING")
                    status_map = {
                        "SUCCESSFUL": "SUCCESS",
                        "FAILED": "FAILED",
                        "PENDING": "PENDING"
                    }
                    return {
                        "status": status_map.get(mtn_status, "PENDING"),
                        "raw": data
                    }
            except Exception as e:
                logger.error(f"[MTN MoMo] Exception CheckStatus: {e}")

        return {"status": "PENDING"}


# =====================================================================
# 2. CLIENT AIRTEL MONEY (AIRTEL AFRICA OPEN API - CONGO XAF)
# =====================================================================

class AirtelMoneyClient:
    """
    Client direct pour l'API Airtel Money Merchant Payments (Congo CG / XAF).
    Doc: https://developers.airtel.africa/
    """
    def __init__(self):
        self.base_url = os.getenv("AIRTEL_MONEY_BASE_URL", "https://openapi.airtel.africa")
        self.client_id = os.getenv("AIRTEL_MONEY_CLIENT_ID", "")
        self.client_secret = os.getenv("AIRTEL_MONEY_CLIENT_SECRET", "")
        self.country = os.getenv("AIRTEL_MONEY_COUNTRY", "CG")  # Congo
        self.currency = os.getenv("AIRTEL_MONEY_CURRENCY", "XAF")

    async def get_access_token(self) -> Optional[str]:
        """Génère un Bearer Token OAuth2 auprès d'Airtel Money."""
        if not self.client_id or not self.client_secret:
            logger.warning("[Airtel Money] Clés Client ID/Secret non renseignées. Mode simulation actif.")
            return None

        url = f"{self.base_url}/auth/oauth2/token"
        headers = {"Content-Type": "application/json"}
        body = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(url, headers=headers, json=body)
                if response.status_code == 200:
                    return response.json().get("access_token")
                logger.error(f"[Airtel Money] Échec Auth OAuth ({response.status_code}): {response.text}")
            except Exception as e:
                logger.error(f"[Airtel Money] Exception Auth OAuth: {e}")
        return None

    async def request_to_pay(self, phone_number: str, amount_fcfa: int, reference_id: str) -> Dict[str, Any]:
        """
        Déclenche une invite de paiement USSD (*128#) sur le téléphone de l'utilisateur Airtel.
        """
        token = await self.get_access_token()
        if not token:
            return {
                "success": True,
                "mode": "SIMULATION",
                "reference_id": reference_id,
                "status": "PENDING",
                "operator": "Airtel Money Congo",
                "ussd_instruction": f"Composez *128# pour valider le prélevement de {amount_fcfa:,} FCFA."
            }

        # Nettoyage du numéro au format local sans préfixe (ex: 055128899 ou 04XXXXXXX)
        clean_phone = phone_number.replace("+242", "").replace(" ", "").replace("-", "")

        url = f"{self.base_url}/merchant/v1/payments/"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Country": self.country,
            "X-Currency": self.currency,
            "Content-Type": "application/json"
        }
        body = {
            "reference": reference_id,
            "subscriber": {
                "country": self.country,
                "currency": self.currency,
                "msisdn": clean_phone
            },
            "transaction": {
                "amount": amount_fcfa,
                "country": self.country,
                "currency": self.currency,
                "id": reference_id
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.post(url, headers=headers, json=body)
                res_data = response.json()
                status_code = res_data.get("status", {}).get("code")
                if response.status_code in [200, 201] and status_code in ["200", "201", "202"]:
                    return {
                        "success": True,
                        "mode": "LIVE",
                        "reference_id": reference_id,
                        "status": "PENDING",
                        "operator": "Airtel Money Congo",
                        "ussd_instruction": f"Une notification USSD a été envoyée sur votre téléphone Airtel ({phone_number}). Composez *128# pour valider votre PIN."
                    }
                logger.error(f"[Airtel Money] Erreur Payment ({response.status_code}): {response.text}")
                return {"success": False, "error": response.text}
            except Exception as e:
                logger.error(f"[Airtel Money] Exception Payment: {e}")
                return {"success": False, "error": str(e)}

    async def get_transaction_status(self, reference_id: str) -> Dict[str, Any]:
        """Vérifie le statut d'une transaction de paiement Airtel Money."""
        token = await self.get_access_token()
        if not token:
            return {"status": "SUCCESS", "message": "Transaction simulée avec succès"}

        url = f"{self.base_url}/standard/v1/payments/{reference_id}"
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Country": self.country,
            "X-Currency": self.currency
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    res_status = data.get("data", {}).get("transaction", {}).get("status", "PENDING")
                    # Statuts Airtel: TS (Success), TF (Failed), TIP (In Progress)
                    status_map = {
                        "TS": "SUCCESS",
                        "TF": "FAILED",
                        "TIP": "PENDING"
                    }
                    return {
                        "status": status_map.get(res_status, "PENDING"),
                        "raw": data
                    }
            except Exception as e:
                logger.error(f"[Airtel Money] Exception CheckStatus: {e}")

        return {"status": "PENDING"}


# Instances des clients prêts à l'emploi
mtn_momo_client = MtnMomoClient()
airtel_money_client = AirtelMoneyClient()
