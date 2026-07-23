# PRISM Metrics & Formulas Guide

This document explains the mathematical formulas, calculations, data flow, and database models used for computing cognitive and analytics metrics in the PRISM Tutor Orchestration module (Tutor Analytics).

---

## 1. Core Metrics & Formulas

### A. Understanding Level ($P_{know}$)

- **Wording in UI**: "Understanding Level" (formerly displayed as raw $P(know)$).
- **Concept**: The probability that a student has mastered a specific concept, calculated dynamically using a **Bayesian Knowledge Tracing (BKT)** model.
- **Update Formula**:
  When a student submits an answer or requests a hint, the system updates $P_{know}$ using the standard BKT equations:

  $$\text{If answer is Correct ($is\_correct = True$):}$$
  $$P_{know, \text{posterior}} = \frac{P_{know} \times (1 - P_{slip})}{P_{know} \times (1 - P_{slip}) + (1 - P_{know}) \times P_{guess}}$$

  $$\text{If answer is Incorrect ($is\_correct = False$):}$$
  $$P_{know, \text{posterior}} = \frac{P_{know} \times P_{slip}}{P_{know} \times P_{slip} + (1 - P_{know}) \times (1 - P_{guess})}$$

  After calculating the posterior, transition updates are applied:
  $$P_{know} = P_{know, \text{posterior}} + (1 - P_{know, \text{posterior}}) \times P_{transit}$$

- **BKT Constants** (defined in `backend/app/mastery.py`):
  - $P_{guess} = 0.25$ (Probability of guessing correctly without mastery)
  - $P_{slip} = 0.10$ (Probability of making a slip/error despite mastery)
  - $P_{transit} = 0.15$ (Probability of learning/transitioning on an activity)

- **Code Location**: `backend/app/mastery.py` -> `update_mastery(prior_p_know: float, is_correct: boolean)`.

---

### B. Misconception Impact Score ($impact\_score$)

- **Concept**: Grade-wide severity index prioritizing which misconceptions have the largest impact on student learning across the entire cohort.
- **Formula**:

  $$\text{Impact} = 0.42 \times \left( \frac{\text{Affected Learners}}{\text{Total Active Learners}} \right) + 0.22 \times \text{Recent Incorrect Rate} + 0.18 \times \text{Repeat Error Rate} + 0.10 \times \text{Downstream Risk} + 0.08 \times \text{Trend Growth}$$
  - **Affected Ratio ($\frac{\text{Affected}}{\text{Total}}$)** (Weight: 42%): Direct proportion of the active cohort showing this misconception.
  - **Recent Incorrect Rate** (Weight: 22%): Error rate of the misconception in recent sessions.
  - **Repeat Error Rate** (Weight: 18%): Likelihood of a student repeating this error multiple times.
  - **Downstream Dependency Risk** (Weight: 10%): Risk of this concept blocking advanced concepts (preset to a placeholder constant $0.5$ in code).
  - **Trend Growth** (Weight: 8%): Rate at which this misconception is rising.

- **Code Location**: `backend/app/tutor_analytics_models.py` -> `_compute_cluster_impact()`.

---

### C. Trend Growth ($trend\_growth$)

- **Concept**: Represents the percentage change in the rate/frequency of a class-wide misconception over recent evaluation intervals.
  - Positive values (e.g., $+18\%$) indicate the misconception is becoming more prevalent.
  - Negative values indicate it is declining.
- **Values in Code**: Seeded as a percentage multiplier (e.g., $0.18$, $0.05$, $0.02$) in the `misconception_clusters` table during startup.

---

### D. Blocker Confidence ($blocker\_confidence$)

- **Concept**: The system's statistical confidence that a student is blocked on their current target concept due to a specific prerequisite conceptual gap (e.g., $student-01$ is target $eq.inverse\_operations$ but blocked by $num.signed\_operations$).
- **Values in Code**: Derived by evaluating the student's mastery of prerequisite concepts. Persisted in `teacher_summaries` and seeded via sample synthetic learner cards in `tutor_analytics_models.py`.

---

### E. Question Difficulty

- **Concept**: Scaled level of complexity of the question prompting the interaction.
  - $0.0 \dots 0.4$: Foundational
  - $0.4 \dots 0.7$: Developing
  - $0.7 \dots 1.0$: Advanced
- **Values in Code**: Authored statically in the question objects database bank schema to guide BKT scaling and scaffolding behavior.

---

### F. Evidence Points & Independent Answers

- **Evidence Points (`evidence_count`)**: The raw number of distinct evaluated student attempts, questions answered, or hints requested on a concept. Every event logged increments this count, representing the "sample size" of evidence.
- **Independent (`independent_correct_count`)**: The number of questions the student resolved completely correctly on their **very first attempt** _without_ requesting or receiving any Socratic hints or worked steps. This represents the student's pure self-guided accuracy.

---

## 2. Seed Data vs. Production Calculations

- **Are these metrics dummy/fake?**
  - When first starting backend servers, database tables (`teacher_summaries`, `mastery_history`, `misconception_clusters`) are seeded with realistic Grade 8 school data in `tutor_analytics_models.py:seed_tutor_analytics_data()` to guarantee the dashboards show coherent, interactive charts, cards, and clusters out-of-the-box.
  - **However, the calculations are fully functional and real-time.** As soon as a student selects a question and interacts with the Tutor (on `/tutor` page), submitting correct/incorrect responses or requesting hints:
    1. The backend (`backend/app/tutor.py`) processes the input.
    2. Answers are evaluated deterministically (`backend/app/scoring.py`).
    3. The BKT solver recalculates $P_{know}$ (`backend/app/mastery.py`).
    4. New records are appended under `mastery_history` (incrementing evidence counts).
    5. The client state is synchronized with `teacher_summaries` in real-time, changing their Mastery Band, Target Pathway, blocker status, and evidence metrics dynamically.

---

## 3. Explaining Concepts and DB Fields from Student Summaries

### `attempts on...`

- **What it means**: Refers to the count of logged evaluation sessions on the specific target concept before resolving a question or getting blocked.
- **Where it is used**: Logged under `evidence_summary` in `teacher_summaries` to tell teachers how many attempts a student took on an assignment before the misconception blocker was tagged.

### `Consistent division errors`

- **What it means**: The descriptive summary tag for a student struggling with division concepts.
- **Where it is defined**: This is seeded inside `SAMPLE_LEARNERS` (for `student-05`) in `tutor_analytics_models.py` on line 108. It describes their prerequisite blocker summary.

---

## 4. UI Cleanups (Raw Internal IDs Normalized)

To ensure teachers and students see friendly concept titles and error tags rather than raw internal database tags:

- **Concepts** (e.g., `eq.inverse_operations`) are mapped onto beautiful, clear titles (e.g., `"Basic Equations (Inverse Operations)"`) via the `CONCEPT_NAMES` mapping configuration in `TutorPage.tsx`.
- **Errors** (e.g., `eq.sign_not_transferred`) are automatically sanitized on load via regex:
  ```typescript
  // Replace underscores with spaces and remove technical package prefixes
  error_tag.replace(/_/g, " ").replace(/\beq\.|num\./g, "");
  ```
  This turns `eq.sign_not_transferred` -> `"sign not transferred"` and `num.division_error` -> `"division error"`.
