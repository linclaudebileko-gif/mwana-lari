"""
Password Security & Breach Verification Module (Mwana Lari)
------------------------------------------------------------
Implements robust password policy enforcement and Have I Been Pwned (HIBP)
Pwned Passwords k-anonymity verification:
- Only sends 5-character SHA-1 prefix over HTTPS to Pwned Passwords API.
- Performs suffix comparison strictly on the local server.
- NEVER transmits the raw password or its full SHA-1 hash.
- NEVER logs plain passwords, full hashes, or suffixes into server logs.
- Accommodates long passphrases with spaces and diverse Unicode characters.
- Controlled fail-open / resilient behavior in case of external service downtime.
"""

import hashlib
import logging
from typing import Tuple, Optional
import httpx
from fastapi import HTTPException, status
from ..config import settings

logger = logging.getLogger("mwana_lari_security")

PWNED_PASSWORDS_API_URL = "https://api.pwnedpasswords.com/range"

def check_pwned_passwords(
    password: str,
    client: Optional[httpx.Client] = None
) -> Tuple[bool, int]:
    """
    Checks if a password appears in a known breach database using HIBP Pwned Passwords API
    with the k-anonymity model.

    Privacy & Security Guarantees:
    - Never transmits the full password.
    - Never transmits the full SHA-1 hash.
    - Sends only the 5-character SHA-1 prefix.
    - Compares the remaining 35-character suffix locally.
    - Never logs passwords or hashes.

    Returns:
        Tuple[bool, int]: (is_compromised, breach_count)
    """
    if not settings.CHECK_PWNED_PASSWORDS:
        return False, 0

    if not password:
        return False, 0

    # 1. Compute local SHA-1 hash in uppercase hex
    sha1_hex = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix = sha1_hex[:5]
    suffix = sha1_hex[5:]

    url = f"{PWNED_PASSWORDS_API_URL}/{prefix}"
    headers = {
        "User-Agent": "MwanaLari-Security/1.0",
        "Add-Padding": "true"  # Requests random padding to resist packet-length inspection
    }

    try:
        # Use provided client or an ephemeral one with configured timeout
        if client:
            resp = client.get(url, headers=headers)
        else:
            with httpx.Client(timeout=settings.PWNED_PASSWORDS_TIMEOUT) as local_client:
                resp = local_client.get(url, headers=headers)

        if resp.status_code == 200:
            for line in resp.text.splitlines():
                parts = line.strip().split(":")
                if len(parts) == 2:
                    ret_suffix, count_str = parts[0].strip(), parts[1].strip()
                    if ret_suffix == suffix:
                        try:
                            count = int(count_str)
                        except ValueError:
                            count = 1
                        # Log ONLY an anonymous warning (NO password, NO hash, NO suffix)
                        logger.warning(
                            "Mot de passe compromis détecté via vérification k-anonymity HIBP (rejeté)."
                        )
                        return True, count

            return False, 0
        else:
            # Non-200 response from external service
            logger.warning(
                "Le service de vérification des mots de passe a renvoyé le statut HTTP %s. "
                "Application de la politique de continuité.",
                resp.status_code
            )
            if not settings.PWNED_PASSWORDS_FAIL_OPEN:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Le service de vérification des mots de passe est temporairement indisponible. Veuillez réessayer ultérieurement."
                )
            return False, 0

    except (httpx.RequestError, httpx.TimeoutException, Exception) as exc:
        # Service unreachable or timeout
        # CRITICAL: Do NOT include password or hash in log!
        logger.warning(
            "Impossible de joindre le service de vérification des mots de passe compromis (%s). "
            "Continuité assurée selon la politique système.",
            type(exc).__name__
        )
        if not settings.PWNED_PASSWORDS_FAIL_OPEN:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Le service de vérification des mots de passe est temporairement indisponible. Veuillez réessayer ultérieurement."
            )
        return False, 0


def validate_password_policy(
    password: str,
    client: Optional[httpx.Client] = None
) -> None:
    """
    Validates password against Mwana Lari's hardened security policy:
    1. Minimum length >= 12 characters (configurable).
    2. Supports and encourages long passphrases with spaces/accents/Unicode (up to 256 chars).
    3. Checks against known compromised password databases via k-anonymity.
    
    Raises HTTPException(400) with a clear human-readable message if invalid or compromised.
    """
    if not password or len(password) < settings.MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Le mot de passe doit comporter au moins {settings.MIN_PASSWORD_LENGTH} caractères. "
                "L'utilisation d'une phrase de passe ou d'un gestionnaire de mots de passe est recommandée."
            )
        )

    if len(password) > settings.MAX_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le mot de passe ne peut pas dépasser {settings.MAX_PASSWORD_LENGTH} caractères."
        )

    # Check for compromised passwords via k-anonymity
    is_compromised, _ = check_pwned_passwords(password, client=client)
    if is_compromised:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Ce mot de passe a été compromis dans une fuite de données publique connue. "
                "Pour votre sécurité, veuillez choisir un autre mot de passe unique."
            )
        )
