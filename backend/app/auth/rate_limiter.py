import time
import threading
from collections import defaultdict
from fastapi import Request, HTTPException, status
from typing import Dict, List, Tuple
import os

class InMemoryRateLimiter:
    """
    Sliding window Rate Limiter with thread-safe lock.
    Supports IP resolution behind Cloudflare (CF-Connecting-IP), Render, and Nginx reverse proxies.
    """
    def __init__(self):
        self._lock = threading.Lock()
        # Mapping: key (ip:action) -> list of timestamps
        self._hits: Dict[str, List[float]] = defaultdict(list)
        # Periodic cleanup tracking
        self._last_cleanup = time.time()

    def _get_client_ip(self, request: Request) -> str:
        direct_host = request.client.host if request.client else "127.0.0.1"
        
        # Check if running behind trusted proxy (Cloudflare / Render / Nginx)
        trust_proxy = os.getenv("TRUST_PROXY_HEADERS", "true").lower() in ("true", "1")
        
        if trust_proxy:
            # 1. Cloudflare header (set only by Cloudflare edge)
            cf_ip = request.headers.get("CF-Connecting-IP")
            if cf_ip and len(cf_ip.strip()) <= 45:
                return cf_ip.strip()

            # 2. X-Real-IP header
            real_ip = request.headers.get("X-Real-IP")
            if real_ip and len(real_ip.strip()) <= 45:
                return real_ip.strip()

            # 3. X-Forwarded-For header (take rightmost or leftmost valid IP)
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                ips = [ip.strip() for ip in forwarded.split(",") if ip.strip()]
                if ips:
                    return ips[0][:45]

        return direct_host

    def check_rate_limit(self, request: Request, max_requests: int, window_seconds: int, action: str = "general"):
        """
        Validates whether the current request is within the allowed limit.
        Raises HTTPException(429) if limit is exceeded.
        """
        # Bypass in testing environment if specified
        if os.getenv("DISABLE_RATE_LIMIT", "false").lower() in ("true", "1"):
            return

        client_ip = self._get_client_ip(request)
        rate_key = f"{client_ip}:{action}"
        now = time.time()

        with self._lock:
            # Clean old entries for this key
            cutoff = now - window_seconds
            self._hits[rate_key] = [t for t in self._hits[rate_key] if t > cutoff]

            if len(self._hits[rate_key]) >= max_requests:
                # Calculate retry after in seconds
                oldest_hit = self._hits[rate_key][0]
                retry_after = max(1, int(oldest_hit + window_seconds - now))
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Trop de requêtes. Veuillez patienter {retry_after} secondes avant de réessayer.",
                    headers={"Retry-After": str(retry_after)}
                )

            # Record this request timestamp
            self._hits[rate_key].append(now)

            # Perform periodic memory cleanup every 5 minutes
            if now - self._last_cleanup > 300:
                self._cleanup_all(now)
                self._last_cleanup = now

    def _cleanup_all(self, now: float):
        keys_to_delete = []
        for key, timestamps in self._hits.items():
            valid_ts = [t for t in timestamps if t > (now - 3600)]
            if valid_ts:
                self._hits[key] = valid_ts
            else:
                keys_to_delete.append(key)
        for k in keys_to_delete:
            del self._hits[k]

limiter = InMemoryRateLimiter()

def rate_limit(max_requests: int = 10, window_seconds: int = 60, action: str = "general"):
    """
    FastAPI dependency for declarative rate limiting on endpoints.
    Usage: Depends(rate_limit(5, 60, "login"))
    """
    def dependency(request: Request):
        limiter.check_rate_limit(request, max_requests, window_seconds, action)
    return dependency
