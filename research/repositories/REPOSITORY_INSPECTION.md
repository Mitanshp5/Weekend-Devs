# Public repository inspection — EdTech architecture patterns

**Inspection date:** 2026-07-16. Repository metadata snapshots are stored in `metadata/`; shallow sparse working clones are in `repos/` and deliberately excluded from the parent Git index.

## Scope and evidence discipline

Each conclusion below separates actual inspected code/docs from product inference. These are architectural references, **not** starter code to copy into PRISM.

## 1. Oppia — interactive stateful tutoring and learner-progress domain

- **Repository:** https://github.com/oppia/oppia
- **Snapshot:** ★6,738; Apache-2.0; default branch `develop`; pushed 2026-07-17.
- **Observed stack:** Python backend, Angular/TypeScript frontend; the repository's agent-facing project context identifies Google App Engine integration. This architecture statement is corroborated by the repository's top-level organization (`core/`, `assets/`, `extensions/`, `scripts/`).
- **Evidence inspected:**
  - `core/domain/learner_progress_services.py` stores completed, incomplete, and partially learned activities; persists last playthrough including exploration version and last played state; and exposes degrees of mastery in its displayable topic summary data shape.
  - `core/templates/domain/learner_group/learner-group-user-progress.model.ts` represents per-user story and subtopic progress plus an explicit progress-sharing consent flag.
- **Architectural lesson:** model learning as a stateful journey, not a conversation transcript. Keep a resumable session state alongside per-concept mastery.
- **PRISM-sized adaptation:** `student_progress` + `concept_mastery` + `attempt_event` + `session_state`. Do not import Oppia's platform architecture.
- **Limit:** Oppia is a broad authoring/delivery platform and far exceeds a 36-hour scope.

## 2. Kolibri — offline-first delivery with granular mastery and attempt logs

- **Repository:** https://github.com/learningequality/kolibri
- **Snapshot:** ★1,084; MIT; default branch `develop`; pushed 2026-07-16.
- **Observed stack:** Python/Django backend; Vue frontend; README explicitly calls Kolibri an offline-first platform.
- **Evidence inspected:**
  - `README.md` states: “offline-first platform for teaching and learning with technology without requiring the Internet.”
  - `kolibri/core/logger/viewsets/mastery_log.py` exposes a `MasteryLog` API filtered by content, user, completion, and quiz state.
  - Its serialized mastery record includes criterion, timestamps, completion, aggregate correct count, and time spent.
  - Its `diff` action compares current and previous tries and returns per-attempt correctness differences.
- **Architectural lesson:** completion alone hides the signal teachers need. Capture time, attempt history, correctness, and a mastery criterion; compute comparisons at query time.
- **PRISM-sized adaptation:** persist event records locally first, derive learner/teacher summaries from them, and maintain an offline synchronization queue. For demo reliability, syncing can be a visible simulated queue rather than cloud infrastructure.
- **Limit:** Kolibri does not supply PRISM's root-concept-gap tutoring experience by itself; use it as the offline/progress model reference, not as an AI design.

## 3. Open edX Platform — explicit separation of authoring, delivery, and frontend surfaces

- **Repository:** https://github.com/openedx/openedx-platform
- **Snapshot:** ★8,142; AGPL-3.0; default branch `master`; pushed 2026-07-16.
- **Observed stack:** The README describes a Python/JavaScript Django modular monolith, independently deployable applications, and React micro-frontends.
- **Evidence inspected:**
  - `README.rst` identifies two central services: CMS/Studio for authoring and LMS for delivery.
  - The same README lists separate authoring, learning, learner-dashboard, profile, and account micro-frontends.
  - The setup requires MySQL, Mongo, Memcached, separate migrations, and multiple frontends.
- **Architectural lesson:** distinguish content authoring from student learning and teacher analytics—even if the hackathon UX uses a single app.
- **PRISM-sized adaptation:** keep JSON curriculum/concept content separate from learner event data and dashboard-derived aggregates. One deployable app is sufficient; retain the logical boundaries.
- **Limit:** production Open edX complexity is explicitly high and unfit for the hackathon demo.

## Comparative architecture matrix

| Reference | Learner progress | Adaptivity/interaction | Offline | Teacher/cohort capability | What PRISM borrows |
|---|---|---|---|---|---|
| Oppia | completed/incomplete paths, resumable last state, mastery summaries | stateful interactive explorations | not the primary focus | learner-group progress with consent | state-machine + progress model |
| Kolibri | mastery logs, attempts, time, completion and diff | assessment logging, content/session services | core product property | coaching/log views | local-first telemetry and derived mastery |
| Open edX | LMS/course progress ecosystem | course delivery at scale | not core focus | learner dashboard ecosystem | content/delivery/analytics separation |

## Reusable engineering principles (not copied code)

1. **Append events; derive dashboards.** A wrong answer is evidence, not merely a decrement in a score.
2. **Persist resumable state.** A low-bandwidth learner must return to the same micro-lesson/doubt context.
3. **Separate authored concept data from learner state.** This permits transparent citations and deterministic concept-gap rules.
4. **Treat teacher analytics as a read model.** Aggregate error patterns by concept rather than querying raw chat text manually.
5. **Avoid platform-scale scope.** The repo evidence strongly shows that production LMS complexity is not a 36-hour prototype feature.

## Local inspection inventory

- `metadata/oppia__oppia.json`
- `metadata/learningequality__kolibri.json`
- `metadata/openedx__openedx-platform.json`
- `repos/oppia/` — shallow sparse clone; ~6,643 tracked files checked out
- `repos/kolibri/` — shallow sparse clone; ~5,100 tracked files checked out
- `repos/openedx-platform/` — shallow sparse clone; ~9,227 tracked files checked out

## Additional inspected repositories (implementation evidence)

### 4. Adapt Framework — authorable feedback and assessment data

- **Repository:** https://github.com/adaptlearning/adapt_framework — ★625 at inspection.
- **Observed evidence:** sample course JSON encodes completion, scoring, interaction recording, correct/partial/incorrect outcomes, and distinct feedback. `src/course/config.json` enables storing responses and completion tracking.
- **PRISM lesson:** make remediation data authored: every question needs concept tags, accepted-answer/rubric data, misconception tag, hint, feedback bands, and completion behavior.
- **Limit:** courseware mechanics only; no learner model or AI tutor. Borrow the JSON data shape, not its dated framework/runtime.

### 5. pyKT Toolkit — event schema for future knowledge tracing

- **Repository:** https://github.com/pykt-team/pykt-toolkit — ★416 at inspection.
- **Observed evidence:** the data loader consumes question IDs, concept IDs, response sequences, and masks; models predict next-concept performance and evaluate AUC/accuracy.
- **PRISM lesson:** preserve `question_id`, `concept_id(s)`, correctness, timestamp, and attempt number now so a transparent heuristic can later be replaced by calibrated knowledge tracing.
- **Limit:** a research toolkit requiring historical data, training, evaluation, and calibration—not a 36-hour serving dependency.

### 6. Chatbot UI — tutor-streaming and failure-state UX

- **Repository:** https://github.com/mckaywrigley/chatbot-ui — ★33,296 at inspection.
- **Observed evidence:** TypeScript/Next.js routes stream provider responses; the UI controls in-flight requests with `AbortController` and turns provider/API-key failures into status-coded errors.
- **PRISM lesson:** a tutoring turn must be interruptible; durable learning evidence must remain separate from ephemeral streamed UI messages; provider failure needs an educational fallback.
- **Limit:** generic chat UX, not a mastery system. Reimplement small UX patterns only.

### 7. LobeChat — durable vs ephemeral LLM-message separation

- **Repository:** https://github.com/lobehub/lobe-chat — ★80,208 at inspection.
- **Observed evidence:** its runtime centralizes LLM error classification and explicitly distinguishes persisted database messages from ephemeral/suppressed messages.
- **PRISM lesson:** persist answers, assessments, concept updates, and tutor decisions; do not treat every streamed token/tool trace as learner evidence.
- **Limit:** a very large broad agent platform—not a tutoring implementation base.

## Final 36-hour synthesis

1. Use an **Oppia-like bounded skill state** and deterministic answer classification.
2. Persist **Open edX-like learner × learning-object state** and derive dashboard summaries.
3. Follow **Kolibri's local-write-first pattern**, simplified to browser local storage/IndexedDB plus a visible pending-sync queue.
4. Use **Adapt-like authored JSON** for questions, hints, misconceptions, and feedback bands.
5. Keep the event schema **pyKT-compatible** without pretending a deep knowledge-tracing model is trained.
6. Apply the small UX lessons from Chatbot UI/LobeChat: streaming is interruptible; errors are normalized; only durable decisions enter mastery records.

No large LMS, AI-chat platform, or research framework should be embedded or deployed wholesale for the hackathon.
