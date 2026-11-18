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
    for v in ("GOOGLE_SERVICE_ACCOUNT_B64", "GOOGLE_APPLICATION_CREDENTIALS", "GEMINI_API_KEY"):
        monkeypatch.delenv(v, raising=False)
    with pytest.raises(RuntimeError, match="No Gemini credentials"):
        make_genai_client()


def test_api_key_path_uses_developer_api(monkeypatch):
    for v in ("GOOGLE_SERVICE_ACCOUNT_B64", "GOOGLE_APPLICATION_CREDENTIALS"):
        monkeypatch.delenv(v, raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    assert make_genai_client().vertexai is False
