# PRISM — Tutor Analytics Implementation Spec

### Tutor Orchestrator · Progress Evidence · Teacher Intervention Board

> **Condensed implementation reference for Tutor Analytics' scope.** For full context see `CONTEXT.md`. For deep detail see `my_stuff/PRISM_Tutor_Analytics_Guide.md` and `my_stuff/PRISM_Master_Spec.md`.

---

## ⚠️ Collaboration Rule: NEW FILES ONLY

This is a collaborative project. Developers must **never modify or delete existing files**. All work goes into NEW files to avoid merge conflicts. Extension points:

- **Backend:** Add new modules under `backend/app/` (e.g., `tutor.py`, `progress.py`, `teacher.py`)
- **Backend routes:** Add new router files; register them in main via a new router include (or create a separate router module)
- **Frontend:** Add new page/component files under `frontend/src/pages/` and `frontend/src/components/`
- **Frontend routing:** Create a new route registration file or extend via lazy imports

---

## Part 1 — Tutor Orchestrator

### What It Does

Given a learner's current attempt + diagnosis state (computed elsewhere), the tutor decides _how to talk to the learner_ — not what's true about their knowledge. It's a language layer on top of already-decided facts.

### The Four Modes (Escalation Ladder)

| Attempt               | Mode                 | Behavior                                                     |
| --------------------- | -------------------- | ------------------------------------------------------------ |
| 0 (first try)         | `socratic_hint`      | Ask a focused thinking question — never give away the answer |
| 1st wrong             | `explain_error`      | Conceptual hint tied to the specific misconception tag       |
| 2nd wrong             | `worked_step`        | Show the relevant operation or visual reasoning step         |
| 3rd wrong / "show me" | `direct_explanation` | Full worked explanation                                      |
| After explanation     | `check_thinking`     | One isomorphic transfer question — **mandatory**             |

The ladder only escalates — never skips levels.

### Tutor Response Schema (Structured Output)

```json
{
  "response_mode": "socratic_hint | explain_error | worked_step | direct_explanation | check_thinking",
  "message": "What should happen to both sides before x is alone?",
  "concept_ids": ["eq.inverse_operations"],
  "citation_ids": ["LE-02"],
  "confidence": "low | medium | high",
  "next_action": "await_learner_attempt | show_transfer_question | escalate",
  "safety_flags": []
}
```

### Validation Rules (Reject/Retry If...)

- No known citation supports a factual claim
- Gives a final answer when policy says hint-only
- References unknown concept ID
- Claims high confidence when diagnosis confidence is low
- JSON/schema validation fails

### Grounding Pipeline

```
request → load active concept + prerequisites + authored lesson cards
        → filter to grade/subject/scope
        → hand the LLM only cited chunks (for one-topic scope, direct loading is fine)
        → generate structured response
        → validate (see above)
        → render
```

### Deterministic Fallback (NON-OPTIONAL)

When LLM is unavailable (timeout, no network, quota exceeded):

- Serve the next line of the question's authored `hint_ladder`
- Use the authored `feedback` text for the matched error tag
- Experience degrades from "personalized phrasing" to "same good hint, pre-written" — never breaks

**Build the fallback path BEFORE the LLM path.**

### Question Schema (What Person 1 Provides)

```json
{
  "id": "q.eq.03",
  "concept_id": "eq.inverse_operations",
  "prompt": "Solve: 3x - 5 = 16",
  "expected_answer": "7",
  "rubric": [
    {
      "pattern": "11",
      "error_tag": "eq.stops_before_division",
      "confidence": 1.0
    },
    {
      "pattern": "-7",
      "error_tag": "eq.sign_not_transferred",
      "confidence": 1.0
    }
  ],
  "hint_ladder": [
    "What must happen to both sides before x can be isolated?",
    "First undo subtracting 5. What equation do you get?",
    "Now 3 is multiplying x. What is the inverse operation?"
  ],
  "feedback": {
    "correct": "Correct: you used inverse operations in the right order.",
    "eq.stops_before_division": "You correctly removed 5, but x is still multiplied by 3."
  }
}
```

---

## Part 2 — Progress Evidence History

### What It Shows

Not a bare mastery number — an **evidence ledger** showing _why_ the system believes what it believes.

### Data Shape (From Learner Model, Per Concept)

```json
{
  "learner_id": "student-07",
  "concept_id": "eq.inverse_operations",
  "p_know": 0.62,
  "evidence_count": 4,
  "independent_correct_count": 1,
  "recent_error_tags": ["eq.stops_before_division"],
  "uncertainty": "medium",
  "updated_at": "2026-07-17T09:00:00Z"
}
```

### What to Display

- Per-concept view: `p_know` movement over time
- Annotated with which attempts were independent vs. hint-assisted
- Error tags that appeared along the way
- Clickable concept nodes → evidence ledger (not just a score)

### Mastery Wording Bands

| `p_know`                         | Learner sees                      | Teacher sees                                   |
| -------------------------------- | --------------------------------- | ---------------------------------------------- |
| `< 0.40`                         | "Let's rebuild this idea."        | "Needs prerequisite repair."                   |
| `0.40–0.70`                      | "Getting there — one more check." | "Developing; evidence still limited."          |
| `>= 0.70` + independent evidence | "Ready for the next challenge."   | "Likely mastered; confirm with transfer item." |

---

## Part 3 — Teacher Intervention Board

### Core Question

> "Which students need which intervention, based on what evidence, right now?"

### Panel A — Cohort Command Center ("Walk in and glance" view)

- Learner count by Foundational / Grade-Level / Advanced band
- Active / completed / offline-pending sessions
- Concept heatmap: mastery probability + confidence + error rate
- Top misconception clusters
- Ranked "intervene now" recommendations

### Panel B — Student Intervention Card (Drill-down)

```
Student: Aanya
Current path: Grade-Level
Current target: Multi-step equations
Likely blocker: Inverse operations (0.78 confidence)
Evidence: 3 recent attempts stopped after isolating the constant
Recommended action: 2-minute inverse-operation mini-whiteboard check
Status: 2 local attempts pending sync
```

### Panel C — Misconception Cluster View (Class-wide)

```
Cluster: Stops before dividing the coefficient
Affected: 9 / 24 learners
Trend: +18% today
Current concept: inverse operations
Suggested intervention: "Ask the class: in 3x = 21, is x alone yet?
What operation reverses ×3?"
```

### Cluster Ranking Algorithm

```
impact(cluster) =
   0.42 * affected_distinct_learners / active_learners
 + 0.22 * recent_incorrect_rate
 + 0.18 * repeat_error_rate
 + 0.10 * downstream_dependency_risk
 + 0.08 * trend_growth
```

### Fairness Guardrails

- Never classify a student as "weak" — use: `insufficient evidence`, `needs prerequisite support`, `developing`, `ready for extension`
- Never rank/label students publicly
- Teacher views are role-protected (students cannot see other students' cards)

### Teacher Action Loop

```
cluster detected → teacher sees evidence-backed recommendation
→ teacher assigns targeted repair activity/group
→ learner events resume → dashboard reports post-intervention change
```

---

## Backend API Design (New Endpoints)

### Tutor Endpoints

```
POST /api/tutor/respond
  Body: { learner_id, question_id, attempt_number, learner_answer, error_tag? }
  Returns: TutorResponse schema (see above)

GET /api/tutor/fallback/{question_id}?attempt={n}
  Returns: authored hint/feedback for the given attempt level
```

### Progress Endpoints

```
GET /api/progress/{learner_id}
  Returns: list of mastery states per concept with history

GET /api/progress/{learner_id}/concept/{concept_id}
  Returns: detailed evidence ledger (timeline of attempts, mastery changes)
```

### Teacher Dashboard Endpoints

```
GET /api/teacher/cohort?grade={n}
  Returns: band distribution, session counts, top clusters, interventions

GET /api/teacher/student/{learner_id}
  Returns: student intervention card data

GET /api/teacher/clusters?grade={n}
  Returns: ranked misconception clusters with impact scores
```

---

## Database Tables (New, No Modifications to Existing)

### `tutor_sessions`

```sql
CREATE TABLE tutor_sessions (
    id BIGSERIAL PRIMARY KEY,
    learner_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 0,
    response_mode TEXT NOT NULL,
    message TEXT NOT NULL,
    concept_ids TEXT[] NOT NULL DEFAULT '{}',
    citation_ids TEXT[] NOT NULL DEFAULT '{}',
    confidence TEXT NOT NULL DEFAULT 'medium',
    is_fallback BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `mastery_history`

```sql
CREATE TABLE mastery_history (
    id BIGSERIAL PRIMARY KEY,
    learner_id TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    p_know FLOAT NOT NULL,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    independent_correct_count INTEGER NOT NULL DEFAULT 0,
    recent_error_tags TEXT[] NOT NULL DEFAULT '{}',
    uncertainty TEXT NOT NULL DEFAULT 'high',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `teacher_summaries` (read model, periodically derived)

```sql
CREATE TABLE teacher_summaries (
    id BIGSERIAL PRIMARY KEY,
    learner_id TEXT NOT NULL,
    grade INTEGER NOT NULL,
    current_path TEXT,
    current_target_concept TEXT,
    likely_blocker_concept TEXT,
    blocker_confidence FLOAT,
    evidence_summary TEXT,
    recommended_action TEXT,
    pending_sync_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `misconception_clusters` (read model)

```sql
CREATE TABLE misconception_clusters (
    id BIGSERIAL PRIMARY KEY,
    grade INTEGER NOT NULL,
    error_tag TEXT NOT NULL,
    concept_id TEXT NOT NULL,
    affected_count INTEGER NOT NULL DEFAULT 0,
    total_active INTEGER NOT NULL DEFAULT 0,
    recent_incorrect_rate FLOAT NOT NULL DEFAULT 0,
    repeat_error_rate FLOAT NOT NULL DEFAULT 0,
    trend_growth FLOAT NOT NULL DEFAULT 0,
    impact_score FLOAT NOT NULL DEFAULT 0,
    suggested_intervention TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Frontend Components (New Files Only)

### Pages to Create

- `TutorPage.tsx` — replaces `/tutor` PlaceholderPage content
- `ProgressPage.tsx` — replaces `/progress` PlaceholderPage content
- `TeacherDashboardPage.tsx` — replaces `/teacher` PlaceholderPage content

### Components to Create

- `TutorChat.tsx` — structured tutor interaction (mode-aware rendering)
- `HintLadder.tsx` — visual hint escalation display
- `MasteryTimeline.tsx` — per-concept p_know over time chart
- `EvidenceLedger.tsx` — clickable attempt history with error tags
- `CohortOverview.tsx` — band distribution + session status
- `ConceptHeatmap.tsx` — mastery × confidence × error rate grid
- `StudentCard.tsx` — individual student intervention card
- `ClusterPanel.tsx` — misconception cluster with impact ranking
- `MasteryBadge.tsx` — reusable mastery band indicator with appropriate wording

---

## Acceptance Tests (What "Done" Looks Like)

| Test                       | Pass Condition                                                           |
| -------------------------- | ------------------------------------------------------------------------ |
| Tutor response schema      | Every response validates against the structured schema                   |
| Socratic policy compliance | Ladder progresses correctly: hint → explain → worked → direct → transfer |
| Fallback works             | LLM disabled → authored hint_ladder/feedback renders correctly           |
| Progress evidence          | Mastery timeline shows p_know movement with attempt annotations          |
| Teacher cohort             | Seeded events change the band distribution and session counts            |
| Misconception clusters     | Synthetic events produce ranked clusters with correct impact scores      |
| Student card               | Drill-down shows evidence, blocker, and recommended action               |
| No existing files modified | `git diff --name-only` shows only new files                              |

---

## Build Order

1. **Backend first:** Database tables → progress/teacher read-model endpoints → tutor fallback endpoint → tutor LLM endpoint
2. **Frontend second:** MasteryBadge → ProgressPage → TeacherDashboardPage → TutorPage
3. **Tests throughout:** Every endpoint gets a test; every component gets a render test
4. **Fallback before LLM:** Build and test the deterministic tutor fallback before wiring the LLM path
