# PRISM — Agent Working Context

> **Read this before changing PRISM.** This is the project’s implementation contract and current state. Keep it current whenever a feature is completed, replaced, or discovered to be blocked.

## Product and demo goal

PRISM (**Personalized Remediation and Intelligent Scaffolding for Mastery**) is a Grade 8 adaptive-learning prototype for mixed-ability classrooms. It must turn learner evidence into an understandable next step:

**Observe → Map → Guide → Verify**

The demo must work locally with PostgreSQL and deterministic logic. It is not a generic chatbot or a static dashboard mock-up.

## Non-negotiable requirements

1. **PostgreSQL is the source of truth.** Do not add SQLite. Use Docker Compose with the official `postgres:16-alpine` image.
2. **No production frontend mock data.** Curriculum, learner, mastery, teacher, diagnostic, and recommendation state must be fetched from APIs backed by PostgreSQL. Test-only fixtures belong under `backend/tests/` only.
3. **No hardcoded dynamic values in UI.** Never default a page to a learner ID, synthetic mastery score, subject path, teacher summary, or API-looking result. Require a real route/query/input selection or API response.
4. **Seed all required demo data through `backend/app/database.py`.** `initialize_database()` must be idempotent: create/update schema and seed catalog/demo records only when appropriate. Do not seed through a frontend constant, one-off shell command, or a route side effect.
5. **Launchers must initialize the database.** `setup.sh`, `setup.bat`, `run-dev.sh`, and `run-dev.bat` must call `initialize_database()` after PostgreSQL is healthy and backend dependencies exist, before the app is used.
6. **One ignored root `.env` only.** Copy `.env.example` to `.env`; do not create or document a `backend/.env`. Never commit `.env`, credentials, tokens, or real connection strings.
7. **No fake intelligence.** Keep scoring, misconception tagging, mastery/BKT updates, root-gap inference, and recommendations deterministic and explainable. Any future LLM is optional, bounded, curriculum-grounded, and must have a deterministic fallback.
8. **No broken ends.** Every exposed route, button, CTA, form, nav item, API call, empty state, loading state, and error state must be implemented or intentionally removed. Do not ship dead UI.
9. **Accessibility and motion.** Use `motion/react` only; retain `MotionConfig reducedMotion="user"`, keyboard access, visible focus, semantic controls, sufficient contrast, and reduced-motion behavior.
10. **Do not overwrite teammates’ work.** Pull/fetch before editing, inspect diffs, preserve unrelated changes, do not force-push, and do not rewrite remote history.

## Current implementation status — 2026-07-22

| Area | Current state |
| --- | --- |
| Frontend | React + TypeScript + Vite. `/` is a cinematic, scroll-driven PRISM project overview with an SVG/CSS learning orbit, semantic narrative sections, sticky anchor navigation, responsive re-composition, and reduced-motion support. Catalog, subject paths, tutor, progress, and teacher dashboard routes remain wired. |
| Backend | FastAPI with health, catalog, tutor, progress, and teacher routes. Deterministic scoring/mastery modules exist. |
| Database | PostgreSQL 16 via `compose.yaml`. `initialize_database()` creates schema, seeds Grade 8 catalog data, and seeds prototype tutor-analytics records when analytics tables are empty. |
| Curriculum | Grade 8 NCERT-linked metadata: Mathematics (13 units), Science (13), English (8); 102 concepts. Source-linked catalog is exposed through API. |
| Tutor analytics | Tutor orchestration, learner progress evidence, teacher cohort/intervention read models, and tests exist. Prototype learner/mastery/cluster data is persisted in PostgreSQL, never frontend-local. |
| Local launch | `setup.sh` / `setup.bat` install and verify dependencies; `run-dev.sh` / `run-dev.bat` start PostgreSQL, initialize schema/seeds, then launch FastAPI and Vite. |
| Validation last run | Frontend: 18 Vitest suites / 32 tests passed; production build passed; `git diff --check` passed. Backend tests are currently blocked because Docker Desktop/PostgreSQL is not running. Browser visual QA is blocked because the Camofox browser service is unavailable. |

## Architecture

```text
React / Vite / TypeScript
  ├─ learner: catalog, diagnostic, lesson/practice, tutor, progress
  ├─ teacher: cohort, learners, misconception clusters, interventions
  └─ API clients only for dynamic educational data

FastAPI
  ├─ catalog endpoints
  ├─ deterministic scoring + misconception mapping
  ├─ BKT-style mastery logic
  ├─ tutor orchestration and structured fallback responses
  ├─ progress evidence endpoints
  └─ teacher cohort/read-model endpoints

PostgreSQL 16
  ├─ curriculum_sources, subjects, units, concepts
  ├─ tutor_questions, tutor_sessions, mastery_history
  └─ teacher_summaries, misconception_clusters
```

## Database and seeding contract

- The sole schema/seed entry point is `backend/app/database.py::initialize_database()`.
- The function must be safe to call repeatedly. Preserve real learner activity; do not truncate or overwrite it during normal startup.
- Catalog source records and approved prototype analytics data are defined in this module and inserted only when their relevant database state is empty/updatable.
- For a destructive local reset, explicitly ask the user before truncating learner/analytics tables. Never reset a shared/production database.
- If a new feature needs data, first add the table and idempotent seed/query logic to `database.py`, then create API access, then consume that API from the frontend.
- Do not add sample learner IDs or fallback score objects to frontend code. Test records may be defined in `backend/tests/tutor_analytics_fixtures.py`.

## Environment and launch contract

```bash
cp .env.example .env
./setup.sh       # first-time setup: Docker, deps, schema/seeds, tests/build
./run-dev.sh     # regular development: Docker, schema/seeds, backend + frontend
```

Windows equivalents: `setup.bat`, then `run-dev.bat`.

- Docker Compose reads the root `.env`.
- Backend explicitly loads the root `.env`.
- Health endpoint: `GET /api/health`.
- API docs: `/docs`.
- Do not claim the app is running until the health check succeeds.

## API/data expectations

- `GET /api/catalog/subjects?grade=8`
- `GET /api/catalog/subjects/{subject_slug}/units?grade=8`
- `GET /api/catalog/units/{unit_slug}/concepts`
- Tutor endpoints under `/api/tutor`
- Progress endpoints under `/api/progress`
- Teacher endpoints under `/api/teacher`

API payloads should be typed, explicit about uncertainty, and usable for honest empty states. Never fabricate an API result in a page merely to make a screen look complete.

## UI requirements

- Visual premise: **a calm learning instrument where evidence becomes a clear path**.
- Keep the PRISM signature/orbit as the primary decorative identity; avoid stacked, competing effects.
- Palette direction: deep forest ink + mint signal, with yellow reserved for evidence/recommendation meaning. Avoid casual purple/blue accent sprawl.
- Make the primary diagnostic CTA clear and high contrast.
- Sidebar navigation must remain fixed/non-scrollable on dashboard layouts.
- Landing/login/start screens should fit their viewport without document scrolling.
- Use loading, empty, error, focus, and mobile layouts as first-class states.

## Required verification before reporting completion

Run the checks relevant to edited code and report real results:

```bash
cd backend && .venv/bin/python -m pytest tests/ -q
cd frontend && npm test -- --reporter=dot && npm run build
cd .. && git diff --check
```

For launcher/database changes also verify that PostgreSQL is healthy, call `initialize_database()`, and query non-sensitive row counts. Never print secrets from `.env`.

## Remaining work (priority order)

1. Build real diagnostic session/attempt APIs and persist learner evidence.
2. Connect diagnostic answers to deterministic misconception, mastery, root-gap, and remediation sequencing.
3. Replace remaining placeholder learning/lesson surfaces with API-backed learner flows and honest empty states.
4. Add durable learner identity/auth or a safe learner-selection workflow; remove manual learner-ID input when identity is available.
5. Persist teacher read models from actual learner events rather than prototype seed records.
6. Add offline-first cache, IndexedDB outbox, idempotent reconciliation, and sync status UI.
7. Add curriculum authoring/import workflow for tutor questions and remediation content; do not rely on frontend hardcoding.
8. Add bounded LLM augmentation only after deterministic fallbacks, citations, learner controls, and safety behavior are complete.
9. Perform full desktop/mobile/reduced-motion visual QA plus end-to-end local-launch verification on macOS/Linux and Windows.

## Key files

- `compose.yaml` — PostgreSQL 16 service.
- `.env.example` — safe root environment template; actual `.env` is ignored.
- `backend/app/database.py` — database URL, schema, idempotent seed data, catalog queries.
- `backend/app/curriculum.py` — authored Grade 8 source-linked curriculum input.
- `backend/app/main.py` — FastAPI entrypoint/router registration.
- `backend/app/tutor.py`, `progress.py`, `teacher.py` — learning/analytics routes.
- `backend/tests/` — backend tests; fixtures must remain test-only.
- `frontend/src/api/` — typed API clients.
- `frontend/src/pages/` — route pages; keep dynamic data API-backed.
- `setup.sh`, `setup.bat`, `run-dev.sh`, `run-dev.bat` — installation and launch paths; must initialize the database.
- `SPEC_TUTOR_ANALYTICS.md` — detailed tutor analytics specification.
- `research/agentic-ui/PRISM_AGENTIC_UI_PIPELINE.md` — explainable agentic UX rationale.
