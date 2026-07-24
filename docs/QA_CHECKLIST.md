# PRISM — Quality Assurance (QA) Checklist & Acceptance Suite

This checklist tracks quality assurance across all functional, visual, accessibility, and backend requirements specified in the PRISM Master Specification (§12 Evaluation Matrix).

---

## 📋 Functional Acceptance Tests

- [x] **Diagnostic Intake (`/diagnostic`)**
  - [x] 5 sequential diagnostic questions loaded from backend.
  - [x] Answers submitted to `/api/tutor/respond` and update $P(\text{know})$ mastery states.
  - [x] Result screen displays placement band (Foundational / Grade-Level / Advanced).
  - [x] Evidence per concept displayed with clear $P(\text{know})$ percentage badges.
  - [x] "Start recommended lesson" CTA correctly routes to `/lesson/:conceptId`.

- [x] **Adaptive Micro-Lesson (`/lesson/:lessonId`)**
  - [x] Concept name, prerequisite chain, and live BKT donut chart rendered.
  - [x] Practice stage presents 3 concept-specific questions in difficulty order.
  - [x] Inline Socratic feedback provided per attempt.
  - [x] Completion screen rendered upon finishing practice or reaching mastery $\ge 0.70$.

- [x] **Evidence & Recommendation Panel**
  - [x] Panel slides in smoothly from right edge upon clicking "📊 Evidence".
  - [x] Current BKT mastery and transparent reason trace displayed.
  - [x] Learner control: "Review evidence" navigates to `/progress`.
  - [x] Learner controls: "Try easier" / "Try harder" filter questions by difficulty.
  - [x] Learner control: "Retry this lesson" resets practice state.
  - [x] Backdrop overlay closes panel on click.

- [x] **Socratic AI Tutor (`/tutor`)**
  - [x] Subject filter pills (All, Mathematics, Science, English) filter available questions.
  - [x] 4-mode hint escalation ladder works (*Think About It* → *What Went Wrong* → *Show Me a Step* → *Full Solution*).
  - [x] Quick guidance options ("Am I on track?", "What to study next?", "Recommend practice") fetch deterministic responses.

- [x] **Progress & Evidence History (`/progress`)**
  - [x] Subject results summary donut charts render correctly.
  - [x] Filter pills (All, Math, Science, English) filter concepts.
  - [x] Clicking a concept loads detailed timeline entries from backend.

- [x] **Teacher Dashboard (`/teacher`)**
  - [x] Cohort metrics (Total learners, Band distribution) displayed.
  - [x] Student intervention cards list current path, blocker concept, and recommended action.
  - [x] Class misconception clusters show affected student count and impact score.

---

## ♿ Accessibility & Responsive UI

- [x] **Motion Controls**: `MotionConfig reducedMotion="user"` honored across page transitions.
- [x] **Keyboard Navigation**: All interactive buttons, options, inputs, and links accessible via Tab / Enter / Space.
- [x] **ARIA Attributes**: `role="progressbar"`, `aria-pressed`, `aria-label`, and proper heading hierarchy ($h1 \to h2$) present.
- [x] **Responsive Layout**: Shell, grids, and cards adapt cleanly down to 320px mobile viewports without horizontal scroll overflow.

---

## ⚡ Verification Commands Executed

```bash
# 1. Backend Pytest Suite
cd backend && python -m pytest tests/ -q
# Result: 31 passed

# 2. Frontend Vitest & Production Build
cd frontend && npm test -- --run && npm run build
# Result: 12 passed, production build clean
```
