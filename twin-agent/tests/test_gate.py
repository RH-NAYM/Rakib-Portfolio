from datetime import datetime

import pytest

from app import gate as G
from app.gate import CostMeter, Gate, MemoryBackend, UpstashBackend, check_startup, client_ip, dhaka_day, ip_key


def test_ipv6_same_64_shares_key_ipv4_full_address():
    s = b"k"
    assert ip_key("2001:db8:1:2::1", s) == ip_key("2001:db8:1:2:ffff::9", s)
    assert ip_key("2001:db8:1:2::1", s) != ip_key("2001:db8:1:3::1", s)
    assert ip_key("10.0.0.1", s) != ip_key("10.0.0.2", s)


def test_ip_key_is_keyed_not_plain_hash():
    assert ip_key("10.0.0.1", b"a") != ip_key("10.0.0.1", b"b")


def test_hourly_limit_trips_with_retry_after(gate: Gate):
    now = datetime(2026, 11, 18, 15, 40, tzinfo=G.DHAKA)
    for _ in range(G.PER_HOUR):
        assert gate.admit("1.2.3.4", now).ok
    v = gate.admit("1.2.3.4", now)
    assert (v.ok, v.kind) == (False, "rate_limited")
    assert v.retry_after_s == 20 * 60
    assert gate.admit("5.6.7.8", now).ok  # other visitors unaffected


def test_spend_cap_uses_dhaka_day_and_trips_resting(gate: Gate):
    # 23:30 UTC on the 18th is 05:30 on the 19th in Dhaka.
    late_utc = datetime.fromisoformat("2026-11-18T23:30:00+00:00")
    assert dhaka_day(late_utc) == "2026-11-19"
    m = CostMeter(usd=1.5)
    gate.record_spend(m, late_utc)
    assert gate.admit("1.2.3.4", late_utc).kind == "cap_exceeded"
    assert gate.admit("1.2.3.4", datetime.fromisoformat("2026-11-18T12:00:00+00:00")).ok


def test_meter_prices_every_call():
    m = CostMeter()
    m.add("gemini-2.5-flash", 1_000_000, 0)
    assert m.usd == pytest.approx(0.30)


def test_startup_refuses_unpriced_model():
    with pytest.raises(RuntimeError, match="No price row"):
        check_startup(["gemini-9-ultra"])


def test_startup_refuses_memory_backend_outside_tests(monkeypatch):
    monkeypatch.setenv("TWIN_ENV", "prod")
    monkeypatch.setenv("TWIN_LIMITS_BACKEND", "memory")
    with pytest.raises(RuntimeError, match="only allowed"):
        check_startup(["gemini-2.5-flash"])


def test_startup_accepts_no_extra_secrets_in_prod(monkeypatch):
    monkeypatch.setenv("TWIN_ENV", "prod")
    monkeypatch.delenv("TWIN_LIMITS_BACKEND", raising=False)
    monkeypatch.delenv("IP_HASH_SECRET", raising=False)
    check_startup(["gemini-2.5-flash"])  # only the service account is required now


def test_zero_spend_writes_nothing():
    b = MemoryBackend()
    Gate(b, b"k", 1.0).record_spend(CostMeter())
    assert b._d == {}


def test_client_ip_prefers_vercel_header_and_first_hop():
    assert client_ip({"x-vercel-forwarded-for": "2001:db8::1", "x-forwarded-for": "1.1.1.1"}) == "2001:db8::1"
    assert client_ip({"x-forwarded-for": "203.0.113.9, 10.0.0.1"}) == "203.0.113.9"
    assert client_ip({}) == "0.0.0.0"


def test_upstash_backend_incr_sets_ttl_and_get_parses():
    import httpx

    seen = []
    store = {}

    def handler(req: httpx.Request) -> httpx.Response:
        assert req.headers["Authorization"] == "Bearer tok" and req.url.path == "/pipeline"
        cmds = __import__("json").loads(req.content)
        seen.extend(cmds)
        out = []
        for c in cmds:
            if c[0] == "INCRBYFLOAT":
                store[c[1]] = store.get(c[1], 0.0) + float(c[2])
                out.append({"result": str(store[c[1]])})
            elif c[0] == "EXPIRE":
                out.append({"result": 1})
            elif c[0] == "GET":
                out.append({"result": None if c[1] not in store else str(store[c[1]])})
        return httpx.Response(200, json=out)

    b = UpstashBackend("https://kv.example", "tok", transport=httpx.MockTransport(handler))
    assert b.get("spend_x") == 0.0
    assert b.incr("spend_x", 0.25) == 0.25 and b.incr("spend_x", 0.5) == 0.75
    assert ["EXPIRE", "spend_x", str(UpstashBackend.TTL_S)] in seen
    assert b.get("spend_x") == 0.75


def test_upstash_errors_surface():
    import httpx

    b = UpstashBackend("https://kv.example", "tok", transport=httpx.MockTransport(lambda r: httpx.Response(200, json=[{"error": "WRONGTYPE"}])))
    with pytest.raises(RuntimeError, match="WRONGTYPE"):
        b.get("k")


def test_upstash_requires_env(monkeypatch):
    for k in ("KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"):
        monkeypatch.delenv(k, raising=False)
    with pytest.raises(RuntimeError, match="Upstash"):
        UpstashBackend()


# ── single-variable setup: only the service-account JSON in Vercel ───────────
import base64 as _b64
import json as _json

SA = {"type": "service_account", "project_id": "p1", "private_key": "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n", "client_email": "x@p1.iam.gserviceaccount.com"}


def _clear_sa(monkeypatch):
    for n in G.SA_ENV_NAMES + ("IP_HASH_SECRET", "TWIN_SESSION_SECRET", "TWIN_ADMIN_SECRET"):
        monkeypatch.delenv(n, raising=False)


def test_service_account_accepted_as_raw_json_or_base64(monkeypatch):
    _clear_sa(monkeypatch)
    monkeypatch.setenv("GOOGLE_SERVICE_ACCOUNT_JSON", "  " + _json.dumps(SA, indent=2) + "\n")
    assert G.service_account_info()["project_id"] == "p1"
    _clear_sa(monkeypatch)
    monkeypatch.setenv("GOOGLE_SERVICE_ACCOUNT_B64", _b64.b64encode(_json.dumps(SA).encode()).decode())
    assert G.service_account_info()["client_email"].startswith("x@")


@pytest.mark.parametrize("value", ["not json", _json.dumps({"type": "authorized_user"})])
def test_malformed_service_account_fails_fast(monkeypatch, value):
    _clear_sa(monkeypatch)
    monkeypatch.setenv("GOOGLE_SERVICE_ACCOUNT_JSON", value)
    with pytest.raises(RuntimeError):
        check_startup(["gemini-2.5-flash"])


def test_secrets_derive_from_the_key_stable_and_distinct(monkeypatch):
    _clear_sa(monkeypatch)
    monkeypatch.setenv("TWIN_ENV", "prod")
    monkeypatch.setenv("GOOGLE_SERVICE_ACCOUNT_JSON", _json.dumps(SA))
    ip, ses, adm = G.derived_secret("ip"), G.derived_secret("session"), G.derived_secret("admin")
    assert len({ip, ses, adm}) == 3 and all(len(x) == 32 for x in (ip, ses, adm))
    assert G.derived_secret("ip") == ip  # stable across cold starts
    monkeypatch.setenv("IP_HASH_SECRET", "explicit")
    assert G.derived_secret("ip") == b"explicit"  # explicit env still wins


def test_no_secret_without_key_outside_tests(monkeypatch):
    _clear_sa(monkeypatch)
    monkeypatch.setenv("TWIN_ENV", "prod")
    assert G.derived_secret("session") == b""  # → bot check / admin stay off rather than using a guessable key


def test_limits_fall_back_to_per_instance_with_split_cap(monkeypatch):
    for k in ("KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "TWIN_LIMITS_BACKEND"):
        monkeypatch.delenv(k, raising=False)
    monkeypatch.setenv("TWIN_DAILY_USD_CAP", "3.0")
    assert G.limits_mode() == "instance"
    g = G.gate_from_env()
    assert isinstance(g.backend, MemoryBackend) and g.cap == pytest.approx(1.0)
    monkeypatch.setenv("KV_REST_API_URL", "https://kv.example")
    monkeypatch.setenv("KV_REST_API_TOKEN", "t")
    assert G.limits_mode() == "upstash" and isinstance(G.gate_from_env().backend, UpstashBackend)
