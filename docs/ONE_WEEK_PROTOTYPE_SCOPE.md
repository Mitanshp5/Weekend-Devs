# PRISM — One-Week Proof-Quality Prototype Scope

## Product promise

PRISM is a working adaptive STEM-learning prototype for a mixed-ability classroom. It demonstrates a complete, evidence-backed loop:

`diagnose → personalize lesson → capture error/doubt → infer likely prerequisite gap → remediate → update mastery → show teacher intervention`

It is **not** a production LMS, a multi-grade curriculum platform, or a general-purpose AI chatbot.

## Strict scope

### Build in the week

| Area | Committed scope |
|---|---|
| Subject | One team-selected STEM grade-subject domain, confirmed before content authoring |
| Learning unit | One bounded, prerequisite-rich unit within that domain |
| Concept graph | 8–10 reviewed concepts; direct prerequisite edges; 6–10 known misconceptions |
| Diagnostic | 5 questions across foundational, grade-level, and advanced evidence |
| Adaptive paths | Foundational, Grade-Level, Advanced; one 8–10 minute lesson per path |
| Practice | 3 scored checks per path plus one transfer check after remediation |
| Learner model | Transparent fixed-parameter BKT-style mastery update per concept |
| Doubt flow | Text first; deterministic error/misconception matching; root-gap ranking; discriminating question when uncertain |
| Tutor | Optional grounded Socratic explanation; authored hint/direct-explanation fallback works without API |
| Teacher view | Per-learner level, completion, weak prerequisite, common-error clusters, intervention recommendation |
| Offline | Cached active lesson pack and IndexedDB/local persistence; resume after refresh; clearly labelled pending-sync state |
| Validation | Seeded learner scenarios, unit tests for scoring/diagnosis, end-to-end demo test, offline reload test |

### Explicitly do not build this week

- Multi-grade or multi-subject curriculum authoring platform
- Trained/deployed deep knowledge-tracing model
- Full OCR/handwriting recognition pipeline; image intake is only shown if verified
- Multi-tenant school management, billing, SSO, or complex RBAC
- Real-time multi-device collaboration or full conflict-resolution service
- Large vector database / unrestricted RAG
- Any claim of efficacy without a consented pilot

## Implementation architecture

```text
React + TypeScript + Vite PWA
  ├─ learner flow and teacher dashboard
  ├─ curriculum bundle cache
  └─ IndexedDB event store / pending-sync badge

FastAPI modular monolith
  ├─ curriculum JSON registry
  ├─ deterministic scorer + misconception mapper
  ├─ learner model + recommendation engine
  ├─ root-gap diagnosis engine
  ├─ optional tutor adapter
  └─ teacher analytics endpoint

SQLite
  ├─ learner profiles
  ├─ append-only attempt events
  ├─ derived mastery state
  └─ session / teacher read models
```

No microservices, vector database, or distributed queue in week one. Logical boundaries are kept in code so the prototype can evolve later.

## One-week execution order

| Day | Outcome | Must be demonstrably true |
|---|---|---|
| 1 | Select the domain; then create its curriculum graph, question bank, data schema, and seeded personas | Every question has a concept, scoring rule, misconception tag/hint, and citation |
| 2 | Diagnostic, deterministic scorer, mastery updates, path assignment | Five seeded learners receive explainable different paths |
| 3 | Three micro-lessons, practice loop, graph visualization | Completion and attempts update persisted learner state |
| 4 | Root-gap inference, discriminating questions, authored remediation | Known wrong answers produce correct evidence traces |
| 5 | Teacher dashboard and intervention clusters | Dashboard reads real persisted events—not fixture cards |
| 6 | PWA cache, local persistence, optional LLM tutor + fallback | Refresh/offline path preserves the active session and attempts |
| 7 | Automated checks, demo scripts, polish, fresh-install rehearsal | Full flow works with LLM disabled and under unreliable network |

## Quality gates

1. **No static mock values:** every dashboard number comes from seeded or newly persisted events.
2. **No opaque claim:** every recommendation has a concept/evidence/reason trace.
3. **No API single point of failure:** scoring, paths, diagnosis, hints, and dashboard still work with the tutor API disabled.
4. **No pretend OCR:** image support is omitted unless transcription confidence, learner confirmation, and error handling are working.
5. **No untested “offline” claim:** airplane-mode/refresh/reconnect is rehearsed and recorded.
6. **No generic tutor:** any LLM answer is restricted to the active concept cards and cannot mutate mastery.

## Definition of success

A teacher can identify an at-risk learner, inspect the evidence, give a targeted repair activity, and see the learner complete an independent transfer check. A learner can continue the active lesson under bad connectivity. Every claim is visible in the running prototype.
