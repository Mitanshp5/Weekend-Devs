# WeekendDevs

PRISM workspace: evidence-backed EdTech research and a proof-quality one-week prototype plan.

## Status
- Research and architecture phase only. No product/final application code has been added.

## Local database
- `compose.yaml` uses the official `postgres:18` image. Major PostgreSQL upgrades require a data migration, so do not attach an existing PostgreSQL 16 data volume directly to this service.

## Layout
- `research/companies/` — public-source platform research
- `research/repositories/` — public GitHub repository evidence and inspections
- `notes/` — synthesis, decisions, build constraints, and the one-week delivery scope
- `prototypes/` — temporary experiments only (currently empty)
- `docs/` — future submission material
- `assets/` — future diagrams/media
