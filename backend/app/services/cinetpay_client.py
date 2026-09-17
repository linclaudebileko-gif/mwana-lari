import json
import urllib.request
import urllib.error
import ssl
from typing import Dict, Any, Optional
import os

class CinetPayClient:
    """
    Client d'intégration officiel CinetPay v2 pour Mobile Money (MTN MoMo, Airtel Money)
    et Cartes Bancaires (Visa, Mastercard) pour Mwana Lari.
    Documentation: https://docs.cinetpay.com/api/checkout/v2
    """
    BASE_URL = "https://api-checkout.cinetpay.com/v2"

    def __init__(
        self,
        api_key: Optional[str] = None,
        site_id: Optional[str] = None,
        secret_key: Optional[str] = None,
        is_sandbox: bool = True
    ):
        self.api_key = api_key or os.getenv("CINETPAY_API_KEY", "")
        self.site_id = site_id or os.getenv("CINETPAY_SITE_ID", "")
        self.secret_key = secret_key or os.getenv("CINETPAY_SECRET_KEY", "")
        self.is_sandbox = is_sandbox or (os.getenv("CINETPAY_SANDBOX", "true").lower() in ("true", "1"))

    def is_configured(self) -> bool:
        """Vérifie si les clés API CinetPay de production ou sandbox sont renseignées."""
        return bool(self.api_key and self.site_id)

    async def initiate_payment(
        self,
        transaction_id: str,
        amount: int,
        currency: str = "XAF",
        description: str = "Abonnement Mwana Lari",
        customer_name: str = "Famille",
        customer_surname: str = "Mwana Lari",
        customer_phone_number: str = "+242060000000",
        customer_email: str = "contact@mwanalari.cg",
        customer_city: str = "Brazzaville",
        customer_country: str = "CG",
        return_url: str = "https://mwanalari.cg/#payment-success",
        notify_url: str = "https://mwana-lari-api.onrender.com/api/v1/payments/cinetpay/webhook",
        channels: str = "ALL" # 'ALL', 'MOBILE_MONEY', 'CREDIT_CARD'
    ) -> Dict[str, Any]:
        """
        Initialise un paiement auprès de CinetPay et retourne le payment_token et payment_url.
        """
        # Si les clés CinetPay ne sont pas encore configurées en local, on bascule en mode simulation contrôlé
        if not self.is_configured():
            return {
                "code": "201",
                "message": "CREATED_SIMULATED",
                "status": "SUCCESS",
                "data": {
                    "payment_token": f"cinetpay_token_sim_{transaction_id}",
                    "payment_url": f"/#cinetpay-sim?tx={transaction_id}&amount={amount}",
                    "is_simulated": True,
                    "ussd_instructions": {
                        "MTN_MOMO": f"Tapez *105# pour autoriser le prélèvement de {amount:,} FCFA",
                        "AIRTEL_MONEY": f"Tapez *128# pour autoriser le prélèvement de {amount:,} FCFA"
                    }
                }
            }

        payload = {
            "apikey": self.api_key,
            "site_id": self.site_id,
            "transaction_id": transaction_id,
            "amount": int(amount),
            "currency": currency,
            "description": description,
            "return_url": return_url,
            "notify_url": notify_url,
            "channels": channels,
            "customer_name": customer_name,
            "customer_surname": customer_surname,
            "customer_email": customer_email,
            "customer_phone_number": customer_phone_number,
            "customer_address": "Brazzaville",
            "customer_city": customer_city,
            "customer_country": customer_country,
            "customer_state": "CG",
            "customer_zip_code": "00242",
            "metadata": json.dumps({"source": "mwana_lari_app"})
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{self.BASE_URL}/payment",
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "MwanaLari/1.0"
                }
            )
            # Contexte SSL sécurisé
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                return result
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8")
            try:
                err_json = json.loads(error_body)
                return {"code": str(e.code), "message": err_json.get("message", "Erreur CinetPay"), "data": err_json}
            except:
                return {"code": str(e.code), "message": error_body, "data": None}
        except Exception as e:
            return {"code": "500", "message": f"Erreur de connexion CinetPay: {str(e)}", "data": None}

    async def check_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """
        Vérifie le statut d'une transaction directement auprès des serveurs CinetPay.
        """
        if not self.is_configured():
            return {
                "code": "00",
                "message": "SUCCES",
                "data": {
                    "status": "ACCEPTED",
                    "transaction_id": transaction_id,
                    "is_simulated": True
                }
            }

        payload = {
            "apikey": self.api_key,
            "site_id": self.site_id,
            "transaction_id": transaction_id
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                f"{self.BASE_URL}/payment/check",
                data=req_data,
                headers={"Content-Type": "application/json"}
            )
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            return {"code": "500", "message": str(e), "data": {"status": "UNKNOWN"}}

cinetpay_client = CinetPayClient()
