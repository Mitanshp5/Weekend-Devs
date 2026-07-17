# PRISM API

The FastAPI backend for the one-week PRISM prototype.

## Local development

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e .
.venv/bin/python -m pip install pytest httpx
.venv/bin/python -m pytest tests/ -v
.venv/bin/python -m uvicorn app.main:app --reload
```

Health check: `GET /api/health`

## Foundation status

Implemented and tested:
- deterministic numeric scoring with misconception tags;
- fixed-parameter, explainable BKT mastery update;
- health endpoint.

The learner UI, curriculum content, diagnostic API, root-gap engine, and persistence are still pending.
