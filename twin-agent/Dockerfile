# twin-agent: FastAPI + LangGraph on Cloud Run.
# The corpus is built BEFORE `docker build` (cloudbuild.yaml) and baked in, so the
# image that passes the eval gate is exactly the image that serves (eng D8).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8080
WORKDIR /srv

COPY twin-agent/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY twin-agent/app ./app
COPY twin-agent/evals ./evals
COPY twin-agent/data/corpus.json twin-agent/data/site.json ./data/
COPY content/twin ./content/twin
COPY contracts ./contracts

RUN useradd -r -u 10001 twin && chown -R twin /srv
USER twin

# Knowledge.load() resolves media.yaml relative to the repo layout; mirror it.
ENV TWIN_MEDIA_PATH=/srv/content/twin/media.yaml
CMD ["sh", "-c", "uvicorn app.api:app --host 0.0.0.0 --port ${PORT} --proxy-headers --timeout-keep-alive 75"]
