from datetime import datetime

import pytest

from app import gate as G
from app.gate import CostMeter, Gate, MemoryBackend, check_startup, dhaka_day, ip_key


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
    monkeypatch.setenv("TWIN_LIMITS_BACKEND", "firestore")
    monkeypatch.delenv("IP_HASH_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="IP_HASH_SECRET"):
        check_startup(["gemini-2.5-flash"])


def test_zero_spend_writes_nothing():
    b = MemoryBackend()
    Gate(b, b"k", 1.0).record_spend(CostMeter())
    assert b._d == {}
