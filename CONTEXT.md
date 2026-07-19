# PRISM — Project Context

> **Condensed project reference for agents.** Covers architecture, status, team split, tech stack, and key contracts. For full detail see the referenced source files.

## Product Thesis

PRISM is an adaptive, offline-resilient STEM-learning prototype for mixed-ability classrooms. It turns every learner interaction into explainable evidence, identifies prerequisite gaps behind errors/doubts, gives curriculum-grounded remediation, and tells the teacher whom to help.

**Non-negotiables:** (1) Every adaptation is explainable. (2) Core loop works with NO LLM / NO internet. (3) No static-dashboard theatre — all data from persisted events. (4) No fake ML. (5) No black-box root-gap assertion. (6) No cloud-dependent demo. (7) No hollow AI claim.

## Current Status

| Component                       | Status                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------ |
| React + Vite + TS frontend      | Scaffolded — 7 routes wired, StartPage/DiagnosticPage live, others placeholder |
| FastAPI + Python backend        | Health endpoint, deterministic scoring, BKT mastery — all tested               |
| PostgreSQL (via Docker Compose) | Running, seed data loaded (3 subjects, 34 units, 102 concepts)                 |
| Curriculum metadata             | Grade 8 NCERT-linked (Math 13 units, Science 13 units, English 8 units)        |
| Visual identity                 | CSS done — responsive, accessible, reduced-motion support                      |
| Research & playbook             | Complete — see `research/` and `my_stuff/`                                     |

## Team Split

| Person                    | Scope                                                                     | Branch                             |
| ------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| 1                         | Diagnostic + adaptive backend (APIs, attempts, misconceptions, sessions)  | —                                  |
| 2                         | Learner experience (diagnostic workspace, lessons, practice, feedback UI) | —                                  |
| **Tutor Analytics (you)** | **Tutor orchestrator, progress evidence, teacher intervention board**     | `tutor_orch_progress_teacher_view` |
| 4                         | Demo, PPT, integration, QA                                                | —                                  |

## Architecture

```
PWA Client (React/Vite/TS)
  ├── Learner app (diagnostic, lessons, practice, tutor, progress)
  ├── Teacher dashboard (cohort command center, intervention cards, clusters)
  ├── Local curriculum cache + IndexedDB event store + sync outbox
  └── Service worker for offline

FastAPI Backend (Python 3.12)
  ├── Curriculum Registry (concepts, prerequisites, questions, rubrics)
  ├── Assessment Service (scoring, misconception tagging)
  ├── Learner Model (BKT mastery updates)
  ├── Diagnosis Engine (root-gap inference via concept graph)
  ├── Recommendation Engine (adaptive sequencing)
  ├── Tutor Orchestrator (Socratic/direct policy + LLM gateway)
  ├── Teacher Analytics (read models, cohort aggregation)
  └── Sync Service (idempotent event sync)

PostgreSQL
  ├── Curriculum tables (sources, subjects, units, concepts)
  ├── Learner event tables (attempts, mastery states, sessions)
  └── Teacher read models (summaries, clusters)
```

## Key Data Contracts

### Concept Node

```json
{
  "id": "eq.inverse_operations",
  "label": "Inverse operations",
  "grade": 8,
  "prerequisites": ["num.signed_operations", "num.mul_div_fluency"],
  "mastery_criterion": {
    "min_probability": 0.78,
    "min_independent_correct": 3
  },
  "misconceptions": ["eq.divide_only_constant", "eq.sign_not_transferred"]
}
```

### Mastery State (BKT output per learner-concept pair)

```json
{
  "learner_id": "student-07",
  "concept_id": "eq.inverse_operations",
  "p_know": 0.62,
  "evidence_count": 4,
  "independent_correct_count": 1,
  "recent_error_tags": ["eq.stops_before_division"],
  "uncertainty": "medium"
}
```

### Tutor Response (structured output)

```json
{
  "response_mode": "socratic_hint",
  "message": "What should happen to both sides before x is alone?",
  "concept_ids": ["eq.inverse_operations"],
  "citation_ids": ["LE-02"],
  "confidence": "medium",
  "next_action": "await_learner_attempt",
  "safety_flags": []
}
```

### Mastery Presentation Bands

| `p_know`                         | Learner sees                      | Teacher sees                                   |
| -------------------------------- | --------------------------------- | ---------------------------------------------- |
| `< 0.40`                         | "Let's rebuild this idea."        | "Needs prerequisite repair."                   |
| `0.40–0.70`                      | "Getting there — one more check." | "Developing; evidence still limited."          |
| `>= 0.70` + independent evidence | "Ready for the next challenge."   | "Likely mastered; confirm with transfer item." |

## Existing Backend Files (DO NOT MODIFY)

- `backend/app/main.py` — FastAPI entrypoint, health + catalog endpoints
- `backend/app/scoring.py` — Deterministic numeric scoring with misconception tagging
- `backend/app/mastery.py` — BKT mastery update (fixed parameters)
- `backend/app/database.py` — PostgreSQL connection, schema init, catalog queries
- `backend/app/curriculum.py` — Seed data: 3 subjects, 34 units, 102 concepts
- `backend/tests/` — test_api.py, test_scoring.py, test_mastery.py, test_catalog_api.py

## Existing Frontend Files (DO NOT MODIFY)

- `frontend/src/App.tsx` — Router with 7 routes
- `frontend/src/App.css` — Full design system
- `frontend/src/pages/StartPage.tsx`, `DiagnosticPage.tsx`, `PlaceholderPage.tsx`
- `frontend/src/pages/CatalogPage.tsx`, `SubjectPathPage.tsx`
- `frontend/src/components/DashboardShell.tsx`, `PrismParticleField.tsx`, `PrismSignature.tsx`, `PageTransition.tsx`, `AgentPipeline.tsx`
- `frontend/src/app/navigation.ts`

## Deeper Reference Files

- `SPEC_TUTOR_ANALYTICS.md` — Full technical specification for Tutor Analytics (370 lines)
- `my_stuff/PRISM_Tutor_Analytics_Guide.md` — Tutor Analytics build guide (266 lines)
- `research/applicable-patterns/FEATURE_PLAYBOOK.md` — Feature playbook (877 lines)
- `notes/ONE_WEEK_PROTOTYPE_SCOPE.md` — Day-by-day scope and quality gates
- `notes/PRISM_ARCHITECTURE_OBSERVATIONS.md` — Architecture and entity design
- `research/agentic-ui/PRISM_AGENTIC_UI_PIPELINE.md` — UX pipeline patterns
