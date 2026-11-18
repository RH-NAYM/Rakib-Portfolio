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


def test_startup_requires_ip_secret_outside_tests(monkeypatch):
    monkeypatch.setenv("TWIN_ENV", "prod")
    monkeypatch.setenv("TWIN_LIMITS_BACKEND", "upstash")
    monkeypatch.delenv("IP_HASH_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="IP_HASH_SECRET"):
        check_startup(["gemini-2.5-flash"])


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
