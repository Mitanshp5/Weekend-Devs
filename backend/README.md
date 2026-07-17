# PRISM API

FastAPI backend for the PRISM prototype.

## Local development

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/python -m pytest tests/ -v
.venv/bin/python -m uvicorn app.main:app --reload
```

## Current API

- `GET /api/health`
- `GET /api/catalog/subjects?grade=8`

The catalog is seeded idempotently into local SQLite on first access. Grade 8 Mathematics, Science, and English are database records; frontend code fetches them through the API rather than carrying curriculum data.
