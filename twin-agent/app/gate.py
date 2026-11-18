"""Everything about "may this request run": per-IP rate limits, the daily spend
cap and its accounting, and startup safety checks.

Decisions: eng D11 (backstops live in infra), D12 (single spend doc, written in
`finally`), D14 (Asia/Dhaka day), D15 (no per-session limit), R3-6 (IPv6 keyed
by /64), R3-12 (memory backend only when TWIN_ENV=test).
"""

from __future__ import annotations

import hashlib
import hmac
import ipaddress
import os
import threading
from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol
from zoneinfo import ZoneInfo

from app.pricing import assert_priced, cost_usd

DHAKA = ZoneInfo("Asia/Dhaka")
PER_HOUR = int(os.environ.get("TWIN_LIMIT_PER_HOUR", "20"))
PER_DAY = int(os.environ.get("TWIN_LIMIT_PER_DAY", "60"))


def dhaka_day(now: datetime | None = None) -> str:
    return (now or datetime.now(DHAKA)).astimezone(DHAKA).strftime("%Y-%m-%d")


def ip_key(ip: str, secret: bytes) -> str:
    """Keyed hash of the client network. IPv6 is grouped by /64 because one client controls a whole /64."""
    try:
        addr = ipaddress.ip_address(ip.strip())
        net = str(ipaddress.ip_network(f"{addr}/64", strict=False)) if addr.version == 6 else str(addr)
    except ValueError:
        net = "invalid"
    return hmac.new(secret, net.encode(), hashlib.sha256).hexdigest()[:32]


@dataclass
class CostMeter:
    usd: float = 0.0
    calls: list[tuple[str, int, int]] = field(default_factory=list)

    def add(self, model: str, input_tokens: int, output_tokens: int) -> None:
        self.calls.append((model, input_tokens, output_tokens))
        self.usd += cost_usd(model, input_tokens, output_tokens)


class LimitsBackend(Protocol):
    def incr(self, key: str, amount: float) -> float: ...
    def get(self, key: str) -> float: ...
    def push(self, key: str, value: str, ttl_s: int) -> None: ...
    def read(self, key: str, limit: int) -> list[str]: ...


class MemoryBackend:
    """Test-only store. Never allowed in production (see check_startup)."""

    def __init__(self) -> None:
        self._d: dict[str, float] = {}
        self._lists: dict[str, list[str]] = {}
        self._lock = threading.Lock()

    def incr(self, key: str, amount: float) -> float:
        with self._lock:
            self._d[key] = self._d.get(key, 0.0) + amount
            return self._d[key]

    def get(self, key: str) -> float:
        return self._d.get(key, 0.0)

    def push(self, key: str, value: str, ttl_s: int) -> None:
        with self._lock:
            self._lists.setdefault(key, []).insert(0, value)

    def read(self, key: str, limit: int) -> list[str]:
        return list(self._lists.get(key, []))[:limit]


class UpstashBackend:
    """Upstash Redis over its REST API (Vercel Marketplace integration; all-Vercel D17).

    INCRBYFLOAT is atomic server-side; every key gets a TTL so counters clean themselves up.
    Env: KV_REST_API_URL / KV_REST_API_TOKEN (names the Vercel integration injects) or
    UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
    """

    TTL_S = 3 * 24 * 3600

    def __init__(self, url: str | None = None, token: str | None = None, transport=None) -> None:
        import httpx

        url = url or os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
        token = token or os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")
        if not url or not token:
            raise RuntimeError("Upstash Redis env missing (KV_REST_API_URL / KV_REST_API_TOKEN).")
        self._http = httpx.Client(base_url=url.rstrip("/"), headers={"Authorization": f"Bearer {token}"}, timeout=3.0, transport=transport)

    def _pipeline(self, *cmds: list) -> list:
        r = self._http.post("/pipeline", json=list(cmds))
        r.raise_for_status()
        out = r.json()
        for item in out:
            if "error" in item:
                raise RuntimeError(f"upstash: {item['error']}")
        return [item.get("result") for item in out]

    def incr(self, key: str, amount: float) -> float:
        res = self._pipeline(["INCRBYFLOAT", key, str(amount)], ["EXPIRE", key, str(self.TTL_S)])
        return float(res[0])

    def get(self, key: str) -> float:
        (val,) = self._pipeline(["GET", key])
        return float(val) if val is not None else 0.0

    def push(self, key: str, value: str, ttl_s: int) -> None:
        self._pipeline(["LPUSH", key, value], ["EXPIRE", key, str(ttl_s)])

    def read(self, key: str, limit: int) -> list[str]:
        (vals,) = self._pipeline(["LRANGE", key, "0", str(limit - 1)])
        return list(vals or [])


@dataclass
class Verdict:
    ok: bool
    kind: str | None = None  # "rate_limited" | "cap_exceeded"
    retry_after_s: int | None = None


class Gate:
    def __init__(self, backend: LimitsBackend, secret: bytes, daily_cap_usd: float) -> None:
        self.backend = backend
        self.secret = secret
        self.cap = daily_cap_usd

    def admit(self, client_ip: str, now: datetime | None = None, kind: str = "chat") -> Verdict:
        now = (now or datetime.now(DHAKA)).astimezone(DHAKA)
        if self.backend.get(f"spend_{dhaka_day(now)}") >= self.cap:
            return Verdict(False, "cap_exceeded")
        k = ip_key(client_ip, self.secret)
        per_hour = PER_HOUR if kind == "chat" else PER_HOUR * 2  # TTS: replies get replayed
        hour = self.backend.incr(f"rl_{kind}_{k}_{now:%Y%m%d%H}", 1)
        day = self.backend.incr(f"rl_{kind}_{k}_{now:%Y%m%d}", 1)
        if hour > per_hour:
            return Verdict(False, "rate_limited", (60 - now.minute) * 60)
        if day > (PER_DAY if kind == "chat" else PER_DAY * 2):
            midnight = now.replace(hour=23, minute=59, second=59)
            return Verdict(False, "rate_limited", int((midnight - now).total_seconds()) + 1)
        return Verdict(True)

    def record_spend(self, meter: CostMeter, now: datetime | None = None) -> None:
        """Called from `finally` so aborted/timed-out requests still count (eng D12, OV#6)."""
        if meter.usd > 0:
            self.backend.incr(f"spend_{dhaka_day(now)}", meter.usd)


def client_ip(headers) -> str:
    """Visitor IP as set by Vercel's edge. First hop only: later x-forwarded-for entries are client-controlled."""
    raw = headers.get("x-vercel-forwarded-for") or headers.get("x-forwarded-for") or headers.get("x-real-ip") or ""
    return raw.split(",")[0].strip() or "0.0.0.0"


def check_startup(models: list[str]) -> None:
    assert_priced(*models)
    if os.environ.get("TWIN_LIMITS_BACKEND", "upstash") == "memory" and os.environ.get("TWIN_ENV") != "test":
        raise RuntimeError("TWIN_LIMITS_BACKEND=memory is only allowed with TWIN_ENV=test")
    if os.environ.get("TWIN_ENV") != "test" and not os.environ.get("IP_HASH_SECRET"):
        raise RuntimeError("IP_HASH_SECRET must be set outside tests")


def gate_from_env() -> Gate:
    backend: LimitsBackend = MemoryBackend() if os.environ.get("TWIN_LIMITS_BACKEND") == "memory" else UpstashBackend()
    secret = os.environ.get("IP_HASH_SECRET", "test-secret").encode()
    return Gate(backend, secret, float(os.environ.get("TWIN_DAILY_USD_CAP", "2.0")))


# ── signed tokens (visitor session after Turnstile; admin login) ─────────────
import base64 as _b64
import json as _json
import time as _time


def _b64e(b: bytes) -> str:
    return _b64.urlsafe_b64encode(b).decode().rstrip("=")


def _b64d(s: str) -> bytes:
    return _b64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def sign_token(claims: dict, secret: bytes, ttl_s: int, now: float | None = None) -> str:
    body = _b64e(_json.dumps({**claims, "exp": int((now or _time.time()) + ttl_s)}, separators=(",", ":")).encode())
    sig = _b64e(hmac.new(secret, body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def verify_token(token: str | None, secret: bytes, aud: str, now: float | None = None) -> dict | None:
    """Valid signature, matching audience, not expired → claims; anything else → None."""
    if not token or "." not in token or not secret:
        return None
    body, sig = token.rsplit(".", 1)
    good = _b64e(hmac.new(secret, body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, good):
        return None
    try:
        claims = _json.loads(_b64d(body))
    except ValueError:
        return None
    if claims.get("aud") != aud or claims.get("exp", 0) < (now or _time.time()):
        return None
    return claims


# ── admin password (PBKDF2; no extra dependency) ─────────────────────────────
def hash_password(password: str, iterations: int = 310_000, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${dk.hex()}"


def check_password(password: str, stored: str | None) -> bool:
    try:
        algo, iters, salt_hex, hash_hex = (stored or "").split("$")
    except ValueError:
        return False
    if algo != "pbkdf2_sha256":
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iters))
    return hmac.compare_digest(dk.hex(), hash_hex)


# ── conversation logs (phase 4; only when TWIN_LOG_CONVERSATIONS=true) ───────
LOG_TTL_S = 90 * 24 * 3600


def log_turn(backend: "LimitsBackend", record: dict, now: datetime | None = None) -> None:
    backend.push(f"log_{dhaka_day(now)}", _json.dumps(record, ensure_ascii=False), LOG_TTL_S)


if __name__ == "__main__":  # python -m app.gate hash-password
    import getpass
    import sys

    if sys.argv[1:] == ["hash-password"]:
        print(hash_password(getpass.getpass("Admin password: ")))
