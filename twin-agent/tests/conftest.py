import os

os.environ.setdefault("TWIN_ENV", "test")
os.environ.setdefault("TWIN_LIMITS_BACKEND", "memory")
os.environ.setdefault("TWIN_SKIP_APP_IMPORT", "1")

import pytest  # noqa: E402

from app.gate import Gate, MemoryBackend  # noqa: E402
from app.retrieval import Doc, Knowledge, MediaItem  # noqa: E402


@pytest.fixture
def knowledge() -> Knowledge:
    docs = [
        Doc("profile", "Profile & about", "https://x.dev/#about", "site", "I am an Applied AI Engineer & AI Team Lead at HawkEyes in Dhaka."),
        Doc("case-retail", "Case study · Retail", "https://x.dev/work/retail", "case_study", "Retail CV serving 2M+ outlets at ~99% accuracy."),
        Doc("cv", "CV (PDF)", "/cv.pdf", "cv", "B.Sc. EEE, BUBT, 2021."),
    ]
    media = [MediaItem("m1", "/twin-media/retail.jpg", "retail", "Retail dashboard", "Retail dashboard", ("yolo", "retail"))]
    return Knowledge(docs, media, "https://x.dev")


@pytest.fixture
def gate() -> Gate:
    return Gate(MemoryBackend(), b"test-secret", daily_cap_usd=1.0)
