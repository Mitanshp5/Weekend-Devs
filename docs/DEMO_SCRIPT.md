# PRISM — Hackathon Demo Script (3-Minute Judge Flow)

This script outlines the exact sequence for presenting PRISM live to judges.

---

## ⏱️ Timeline Overview (3:00 total)

| Time | Scene | Primary Action | Key Message |
| --- | --- | --- | --- |
| **0:00 - 0:35** | **1. The Problem & Teacher View** | Open `/teacher` | "Teachers have 30 kids and zero real-time gap visibility." |
| **0:35 - 1:15** | **2. Diagnostic Intake** | Complete `/diagnostic` probe | "Diagnosis starts with evidence, not labels." |
| **1:15 - 1:55** | **3. Adaptive Micro-Lesson** | Work on `/lesson/eq.inverse_operations` | "BKT probability updates live after every attempt." |
| **1:55 - 2:30** | **4. Socratic AI Tutor** | Ask a doubt on `/tutor` | "Structured 4-step Socratic ladder with deterministic fallback." |
| **2:30 - 3:00** | **5. Progress & Cohort Signal** | Show `/progress` and return to `/teacher` | "Every attempt updates the class misconception cluster." |

---

## 🎬 Detailed Scene Breakdown

### Scene 1: The Problem & Teacher View (0:00 - 0:35)

- **Screen**: Start on `/teacher` (Teacher Dashboard).
- **Speaker**:
  > "In a Grade 8 STEM classroom, 30 students struggle with linear equations, but for completely different reasons. Traditional apps give generic quizzes and flat percentages. PRISM is built differently — every interaction becomes explainable evidence."
- **Action**: Point out the **Misconception Cluster Card**: *"Stops before dividing coefficient (9 affected students)"*.
- **Point out**: "PRISM doesn't label kids as 'weak'. It identifies the exact prerequisite blocker causing errors across the cohort."

---

### Scene 2: Diagnostic Intake (0:35 - 1:15)

- **Screen**: Navigate to `/diagnostic`.
- **Speaker**:
  > "Let's log in as Aanya. Instead of assigning a static level, PRISM runs a 5-question diagnostic probe across the prerequisite chain — from integer operations to equation word problems."
- **Action**:
  1. Answer Question 1 (Signed Operations): Select correct answer (`-7`).
  2. Answer Question 2 (Inverse Operations): Select common wrong answer (`17` instead of `7` for $x + 5 = 12$).
  3. Complete remaining 3 questions.
- **Outcome**: The **Placement Result Screen** appears:
  - Band: **Needs Prerequisite Support** (or **Grade-Level**)
  - Evidence per concept displayed with $P(\text{know})$ probabilities.
  - Recommended next step: `eq.inverse_operations`.
- **Key Takeaway**: "The adaptation is 100% explainable and backed by Bayesian Knowledge Tracing."

---

### Scene 3: Adaptive Micro-Lesson & Recommendation Panel (1:15 - 1:55)

- **Screen**: Click **"Start recommended lesson"** → opens `/lesson/eq.inverse_operations`.
- **Speaker**:
  > "Aanya enters a focused micro-lesson for Inverse Operations. Watch the mastery ring in the top right — it tracks $P(\text{know})$ live using BKT."
- **Action**:
  1. Answer Question 1. Click **Submit**. Note inline Socratic feedback.
  2. Click **📊 Evidence** in the bottom bar to open the **Evidence & Recommendation Panel**.
- **Point out**:
  - Transparent reason trace explaining *why* PRISM recommended this lesson.
  - Learner controls: **Review Evidence**, **Try Easier**, **Try Harder**, **Retry**.
  - Honest disclosure of BKT parameters ($P(L_0)=0.35, P(T)=0.12, P(S)=0.08, P(G)=0.20$).

---

### Scene 4: Socratic AI Tutor (1:55 - 2:30)

- **Screen**: Navigate to `/tutor` (PRISM AI Tutor).
- **Speaker**:
  > "When a student gets stuck, generic tutors give away the answer or write long essays. PRISM uses a strict 4-mode Socratic escalation ladder."
- **Action**:
  1. Select a question (e.g., `Solve: 2x - 3 = 7`).
  2. Click **💭 Think About It** (Socratic Hint).
  3. Click **🔍 What Went Wrong** (Error Explanation).
  4. Click **📐 Show Me a Step** (Worked Step).
- **Key Takeaway**: "No LLM is required — if internet or API connection drops, PRISM seamlessly uses its deterministic authored fallback."

---

### Scene 5: Progress & Cohort Signal (2:30 - 3:00)

- **Screen**: Navigate to `/progress`, then toggle back to `/teacher`.
- **Speaker**:
  > "On the Progress page, Aanya sees her donut charts and evidence timeline drill-down. And back on the Teacher Dashboard, Aanya's attempt has updated the class-wide cluster analytics in real time."
- **Closing**:
  > "PRISM proves that adaptive EdTech can be offline-first, explainable, and grounded in real classroom needs. Thank you!"
