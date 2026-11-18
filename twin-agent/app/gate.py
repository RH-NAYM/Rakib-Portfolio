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


class MemoryBackend:
    """Test-only store. Never allowed in production (see check_startup)."""

    def __init__(self) -> None:
        self._d: dict[str, float] = {}
        self._lock = threading.Lock()

    def incr(self, key: str, amount: float) -> float:
        with self._lock:
            self._d[key] = self._d.get(key, 0.0) + amount
            return self._d[key]

    def get(self, key: str) -> float:
        return self._d.get(key, 0.0)


class FirestoreBackend:
    """One document per counter key; `Increment` is atomic server-side."""

    def __init__(self) -> None:
        from google.cloud import firestore

        self._fs = firestore
        self._db = firestore.Client(project=os.environ.get("GCP_PROJECT_ID"))
        self._col = self._db.collection("twin_counters")

    def incr(self, key: str, amount: float) -> float:
        ref = self._col.document(key)
        ref.set({"v": self._fs.Increment(amount), "updated": self._fs.SERVER_TIMESTAMP}, merge=True)
        snap = ref.get()
        return float((snap.to_dict() or {}).get("v", 0.0))

    def get(self, key: str) -> float:
        snap = self._col.document(key).get()
        return float((snap.to_dict() or {}).get("v", 0.0)) if snap.exists else 0.0


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

    def admit(self, client_ip: str, now: datetime | None = None) -> Verdict:
        now = (now or datetime.now(DHAKA)).astimezone(DHAKA)
        if self.backend.get(f"spend_{dhaka_day(now)}") >= self.cap:
            return Verdict(False, "cap_exceeded")
        k = ip_key(client_ip, self.secret)
        hour = self.backend.incr(f"rl_{k}_{now:%Y%m%d%H}", 1)
        day = self.backend.incr(f"rl_{k}_{now:%Y%m%d}", 1)
        if hour > PER_HOUR:
            return Verdict(False, "rate_limited", (60 - now.minute) * 60)
        if day > PER_DAY:
            midnight = now.replace(hour=23, minute=59, second=59)
            return Verdict(False, "rate_limited", int((midnight - now).total_seconds()) + 1)
        return Verdict(True)

    def record_spend(self, meter: CostMeter, now: datetime | None = None) -> None:
        """Called from `finally` so aborted/timed-out requests still count (eng D12, OV#6)."""
        if meter.usd > 0:
            self.backend.incr(f"spend_{dhaka_day(now)}", meter.usd)


def check_startup(models: list[str]) -> None:
    assert_priced(*models)
    if os.environ.get("TWIN_LIMITS_BACKEND", "firestore") == "memory" and os.environ.get("TWIN_ENV") != "test":
        raise RuntimeError("TWIN_LIMITS_BACKEND=memory is only allowed with TWIN_ENV=test")
    if os.environ.get("TWIN_ENV") != "test" and not os.environ.get("IP_HASH_SECRET"):
        raise RuntimeError("IP_HASH_SECRET must be set outside tests")


def gate_from_env() -> Gate:
    backend: LimitsBackend = MemoryBackend() if os.environ.get("TWIN_LIMITS_BACKEND") == "memory" else FirestoreBackend()
    secret = os.environ.get("IP_HASH_SECRET", "test-secret").encode()
    return Gate(backend, secret, float(os.environ.get("TWIN_DAILY_USD_CAP", "2.0")))
