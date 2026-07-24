# PRISM — Personalized Remediation and Intelligent Scaffolding for Mastery

**From “I am stuck” to a clear next step.**  
Adaptive microlearning + evidence-grounded doubt resolution for mixed-ability Grade 8 classrooms.

**TetraTHON 2026 · EdTech Track**

---

## 🌟 The Problem

In one Grade 8 classroom, learners enter the same lesson with different prerequisite gaps. A single digital path is either too slow, too hard, or too shallow. STEM doubts compound when a learner receives an answer without repairing the underlying concept, and teachers cannot inspect every learner’s misconception pattern in real time. 

Always-online products fail at the point of need when bandwidth is weak or intermittent.

**PRISM turns a learner’s answer, error pattern, and doubt into one evidence-backed next step—for the learner and for the teacher.**

---

## 🔄 Observe → Map → Guide → Verify

PRISM is built on a deliberately closed 4-stage pedagogical loop. It doesn't diagnose once and permanently label a learner.

1. **OBSERVE (5-Question Probe)**: A short, revisable placement signal tied to prerequisite concepts, response evidence, and a confidence state. Places the learner in a Foundational, Grade-Level, or Advanced starting path.
2. **MAP (Concept + Error Evidence Model)**: Every response maps to a concept graph with uncertainty. It identifies the root-gap concept beneath a question or doubt.
3. **GUIDE (Micro-lesson / Tutor Scaffold)**: A 10-minute targeted repair loop (worked example → self-explanation → targeted practice → immediate feedback).
4. **VERIFY (Transfer Check + Mastery Update)**: A final check validates independent application, updates the concept graph, and surfaces a clear signal to the teacher.

---

## 🧑‍🏫 The Socratic AI Tutor

The tutor escalates help only when the learner needs it, following an attempt-aware pedagogical ladder:

- **1st attempt**: Socratic hint (*“What must happen to both sides before x is alone?”*)
- **1st incorrect**: Explain error (*“You removed 5 correctly, but x is still multiplied by 3.”*)
- **2nd incorrect**: Worked step (*“From 3x = 21, divide both sides by 3: x = 7.”*)
- **3rd incorrect / “show me”**: Direct explanation (Full curriculum-linked worked solution)
- **After explanation**: Check thinking (Isomorphic transfer question)

*Note: The LLM is optional phrasing assistance. The teaching policy and concept model remain deterministic, allowing PRISM to work offline.*

---

## 📊 The Evaluator Dashboard

**Answers: “Who needs what, based on what evidence, now?”**

PRISM does not create a second system for teachers. Learner interactions automatically produce the teacher’s intervention signal. The cohort command view shows active/offline sessions and top misconception clusters ranked by repeat rate, recency, and downstream risk. 

Instead of a wall of charts, teachers receive a **2-minute intervention recommendation** (e.g., *"Ask the learner to solve 3x = 21 on a mini-whiteboard"*).

---

## 🏗️ Architecture & Trust (Offline-First)

Useful before the network is perfect.

- **PWA + Cached Content**: Text-first micro-lessons for quick first paint; useful during poor connectivity.
- **Local Outbox**: Learner work is saved to an IndexedDB outbox when the network fails.
- **Idempotent Events**: A retried sync cannot duplicate an attempt or inflate mastery.
- **PostgreSQL**: The source of truth for durable, auditable learner and curriculum evidence.
- **Optional LLM Layer**: Core diagnosis and authored fallback remain available without external inference.

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

- `frontend/` — React PWA frontend (Pages: `StartPage`, `DiagnosticPage`, `LessonPage`, `TutorPage`, `ProgressPage`, `TeacherDashboardPage`, `CatalogPage`, `SubjectPathPage`, `AuthPage`)
- `backend/app/` — FastAPI application modules (`tutor.py`, `guidance.py`, `learner.py`, `progress.py`, `teacher.py`, `scoring.py`, `mastery.py`, `question_bank.py`, `database.py`)
- `docs/` — System specifications, demo script, metrics explanation, architecture observations, and QA checklist
- `compose.yaml` — Docker Compose configuration for PostgreSQL 16
