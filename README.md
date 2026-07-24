# PRISM — Personalized Remediation and Intelligent Scaffolding for Mastery
### TetraTHON 2026 · EdTech Track · Adaptive Microlearning + AI Doubt-Resolution Tutor

PRISM is an adaptive, offline-resilient STEM learning platform for Grade 8 classrooms. It turns every learner interaction into explainable evidence, identifies prerequisite gaps behind errors or doubts using **Bayesian Knowledge Tracing (BKT)**, delivers curriculum-grounded micro-lessons, and gives teachers real-time intervention insights.

---

## 🌟 The 3-Minute Judge Flow

1. **Diagnostic Probe (`/diagnostic`)**: 5-question sequential probe across prerequisite concepts → evidence-based BKT level placement (Foundational / Grade-Level / Advanced).
2. **Adaptive Micro-Lesson (`/lesson/:conceptId`)**: Targeted concept practice stage with real-time BKT probability updates, hint ladders, and post-attempt evidence tracking.
3. **Evidence & Recommendation Panel**: Slide-in panel showing PRISM's explainable recommendation with transparent reason trace, evidence ledger, and learner controls (Review, Easier, Harder, Retry).
4. **Socratic AI Tutor (`/tutor`)**: Structured 4-mode tutor escalation ladder (*Think About It → What Went Wrong → Show Me a Step → Full Solution*) with deterministic authored fallback and curriculum grounding.
5. **Progress & Evidence History (`/progress`)**: Subject results summary, donut chart analytics, concept progress bars, and full attempt timeline drill-downs.
6. **Teacher Intervention Board (`/teacher`)**: Cohort command center, student intervention cards, and class-wide misconception cluster analysis.

---

## 🚀 Quick Start (Localhost Deployment)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.10+

### First-Time Setup

```bash
# 1. Copy environment variables template
cp .env.example .env

# 2. Run setup script (installs dependencies, starts PostgreSQL 16, initializes schema & seed data)
./setup.sh
# Windows PowerShell / CMD:
# .\setup.bat
```

### Starting Development Servers

```bash
./run-dev.sh
# Windows PowerShell / CMD:
# .\run-dev.bat
```

- **Frontend (Vite PWA)**: `http://localhost:5173`
- **Backend API (FastAPI)**: `http://localhost:8000` (Docs at `http://localhost:8000/docs`)
- **Database**: PostgreSQL 16 on port `5432`

---

## 👥 Pre-Seeded Demo Learner Accounts

Log in or switch accounts using any of these credentials:

| Name | Email Address | Default Password | Role |
| --- | --- | --- | --- |
| **Aanya Sharma** | `aanya@prism.demo` | `Prism_demo_1` | Student |
| **Ravi Kumar** | `ravi@prism.demo` | `Prism_demo_2` | Student |
| **Priya Patel** | `priya@prism.demo` | `Prism_demo_3` | Student |
| **Arjun Singh** | `arjun@prism.demo` | `Prism_demo_4` | Student |
| **Meera Iyer** | `meera@prism.demo` | `Prism_demo_5` | Student |
| **Kabir Das** | `kabir@prism.demo` | `Prism_demo_6` | Student |
| **Nisha Reddy** | `nisha@prism.demo` | `Prism_demo_7` | Student |
| **Vikram Joshi** | `vikram@prism.demo` | `Prism_demo_8` | Student |

*Note: Performance statistics and mastery states are dynamically computed from persisted database event logs.*

---

## 🏗️ Architecture & Non-Negotiables

```text
┌─────────────────────────────────────────────────────────────────┐
│ PRISM React PWA Client (Vite, TypeScript, Motion, CSS)          │
│ Learner Workspace · Diagnostic · Tutor · Progress · Teacher UI │
└───────────────────────────────┬─────────────────────────────────┘
                                │ REST API
┌───────────────────────────────▼─────────────────────────────────┐
│ PRISM FastAPI Application Backend (Python)                       │
│ BKT Engine · Scoring & Rubrics · Tutor Orchestrator · Guidance  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ PostgreSQL 16
┌───────────────────────────────▼─────────────────────────────────┐
│ Relational Database & Read Models                               │
│ curriculum_* · tutor_* · mastery_history · auth_users           │
└─────────────────────────────────────────────────────────────────┘
```

### Seven Non-Negotiable Guarantees
1. **Explainable Adaptation**: Every next-step recommendation carries an inspectable reason trace.
2. **Offline-First Deterministic Core**: The entire learning, scoring, BKT, and tutor loop works without LLMs or internet access.
3. **Persisted Data Truth**: Zero synthetic or mock UI states — all mastery scores and cluster signals derive from PostgreSQL logs.
4. **Bayesian Knowledge Tracing**: Principled probabilistic updates ($P(L_0)=0.35, P(T)=0.12, P(S)=0.08, P(G)=0.20$), not arbitrary percentage averages.
5. **Evidence-Based Root Gap**: Misconceptions and prerequisite blockers are identified via authored rubrics and graph traversal.
6. **Grounding & Safety**: LLM responses are strictly bounded by curriculum context and validated against structured schemas.
7. **Role-Protected Analytics**: Teacher views offer actionable intervention signals without reductive student labelling.

---

## 🧪 Verification & Testing

To run the automated test suite across backend and frontend:

```bash
# Run backend tests
cd backend && pytest tests/ -q

# Run frontend tests & build
cd frontend && npm test -- --run && npm run build
```

---

## 📁 Repository Layout

- `frontend/` — React PWA frontend (Pages: `DiagnosticPage`, `LessonPage`, `TutorPage`, `ProgressPage`, `TeacherDashboardPage`, `CatalogPage`, `SubjectPathPage`, `AuthPage`)
- `backend/app/` — FastAPI application modules (`tutor.py`, `guidance.py`, `learner.py`, `progress.py`, `teacher.py`, `scoring.py`, `mastery.py`, `question_bank.py`, `database.py`)
- `reference_material/` — Master specification, feature playbook, and guide documentation
- `compose.yaml` — Docker Compose configuration for PostgreSQL 16
