# PRISM API

FastAPI backend for the PRISM prototype.

## Local development

1. Copy `.env.example` to `.env` at the repository root and replace the password placeholder.
2. Start PostgreSQL:

```bash
docker compose up -d postgres
```

3. Export the database URL before starting the API:

```bash
set -a; source ../.env; set +a
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/python -m pytest tests/ -v
.venv/bin/python -m uvicorn app.main:app --reload
```

## Current API

- `GET /api/health`
- `GET /api/catalog/subjects?grade=8`

The catalog is seeded idempotently into PostgreSQL on first access. Grade 8 Mathematics, Science, and English are database records; frontend code fetches them through the API rather than carrying curriculum data.
