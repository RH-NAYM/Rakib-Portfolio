import pytest

from app import llm as L


class Busy(Exception):
    def __init__(self, code):
        self.code = code


@pytest.mark.asyncio
async def test_retries_rate_limit_then_succeeds(monkeypatch):
    monkeypatch.setattr(L, "RETRY_DELAYS_S", (0.0, 0.0))
    calls = []

    async def call():
        calls.append(1)
        if len(calls) < 3:
            raise Busy(429)
        return "ok"

    assert await L._with_retry(call) == "ok"
    assert len(calls) == 3


@pytest.mark.asyncio
async def test_gives_up_after_retries(monkeypatch):
    monkeypatch.setattr(L, "RETRY_DELAYS_S", (0.0, 0.0))
    calls = []

    async def call():
        calls.append(1)
        raise Busy(503)

    with pytest.raises(Busy):
        await L._with_retry(call)
    assert len(calls) == 3


@pytest.mark.asyncio
async def test_other_errors_are_not_retried():
    calls = []

    async def call():
        calls.append(1)
        raise Busy(400)

    with pytest.raises(Busy):
        await L._with_retry(call)
    assert len(calls) == 1
