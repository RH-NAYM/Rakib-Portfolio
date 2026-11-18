import json

import pytest

from app.llm import make_genai_client
from app.retrieval import Knowledge


def test_media_catalog_read_from_corpus(tmp_path):
    corpus = tmp_path / "corpus.json"
    corpus.write_text(json.dumps({"version": 1, "docs": [{"id": "a", "title": "A", "url": "", "kind": "site", "text": "x"}],
                                  "media": [{"id": "m", "src": "/twin-media/m.jpg", "project_slug": "p", "caption": "Retail board", "tags": ["retail"]}]}))
    k = Knowledge.load(corpus_path=corpus, media_path=tmp_path / "missing.yaml")
    assert [m.src for m in k.show_media("retail")] == ["/twin-media/m.jpg"]


def test_no_credentials_is_a_clear_error(monkeypatch):
    for v in ("GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT", "GOOGLE_SERVICE_ACCOUNT_B64", "GOOGLE_APPLICATION_CREDENTIALS", "GEMINI_API_KEY"):
        monkeypatch.delenv(v, raising=False)
    with pytest.raises(RuntimeError, match="No Gemini credentials"):
        make_genai_client()


def test_api_key_path_uses_developer_api(monkeypatch):
    for v in ("GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT", "GOOGLE_SERVICE_ACCOUNT_B64", "GOOGLE_APPLICATION_CREDENTIALS"):
        monkeypatch.delenv(v, raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    assert make_genai_client().vertexai is False


def test_healthz_reports_config_without_secrets(knowledge, monkeypatch):
    from fastapi.testclient import TestClient

    from app.api import create_app
    from app.gate import Gate, MemoryBackend
    from app.llm import FakeLLM

    for v in ("GOOGLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT", "GOOGLE_SERVICE_ACCOUNT_B64", "GOOGLE_APPLICATION_CREDENTIALS", "GEMINI_API_KEY", "KV_REST_API_URL"):
        monkeypatch.delenv(v, raising=False)
    h = TestClient(create_app(llm=FakeLLM({}), knowledge=knowledge, gate=Gate(MemoryBackend(), b"k", 1))).get("/api/twin/healthz").json()
    assert h["gemini"] == "missing" and h["limits"] in ("memory", "instance") and "private_key" not in json.dumps(h)
