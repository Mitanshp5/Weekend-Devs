# PRISM — TetraTHON 2026 EdTech Prescreening PPT Content

> **Purpose:** Slide-ready, evidence-backed content for the TetraTHON 2026 EdTech prescreening presentation.
>
> **Problem statement:** *Adaptive Microlearning Engine & AI Doubt-Resolution Tutor for Mixed-Ability Classrooms.*
>
> **Recommended demo spine:** **Grade 8 NCERT Mathematics → Linear Equations in One Variable.**
>
> This is a deliberate presentation choice, not a claim that PRISM is only for mathematics. A single, traceable concept journey lets judges verify the diagnostic, remediation, tutor, graph, and teacher-action loop instead of seeing a vague multi-subject platform. The PRISM catalog is structured around Grade 8 NCERT-linked Mathematics, Science, and English metadata; the deck should use linear equations as the flagship end-to-end proof.

---

## 0. How to use this document

- Use **Slides 1–15** as the main prescreening deck (about 10–12 minutes).
- Use **Slides 16–18** as appendix / Q&A support unless the team is given more time.
- Text in **bold** is slide copy or an on-screen label.
- *Speaker notes* are for the presenter; do not overcrowd slides with them.
- **Do not claim a feature is live unless it is verified in the current build.** Use the wording in the `Claim policy` section.
- Visuals must be product diagrams, verified screenshots, or clearly labelled illustrative flows—never invented charts, school logos, user testimonials, adoption figures, or fabricated performance numbers.

---

## 1. Evaluation-first strategy

The booklet evaluates only three things. The deck should make the judging logic obvious.

| Evaluation criterion | What the judges need to believe | Where PRISM proves it |
|---|---|---|
| **Understanding of the problem statement** | The team understands mixed-ability classrooms, unresolved STEM doubts, teacher workload, and constrained connectivity—not merely “students need AI.” | Slides 3–4 |
| **Proposed approach** | The solution is a coherent, technically credible system with explainable decision points; it is not a generic chatbot + dashboard. | Slides 5–12 |
| **Market fit & real-world relevance** | The first deployment is feasible, useful for teachers and learners, and can grow without requiring perfect connectivity or expensive AI inference. | Slides 13–15 |

### One-sentence positioning

> **PRISM turns a learner’s answer, error pattern, and doubt into one evidence-backed next step—for the learner and for the teacher.**

### What makes this non-generic

1. **A 5-question probe is not presented as a magical IQ test.** It is a short, revisable placement signal tied to prerequisite concepts, response evidence, and a confidence state.
2. **A “micro-lesson” is not a video playlist.** It is a short repair loop: worked example → self-explanation → targeted practice → immediate next-step decision.
3. **The tutor is not an open-ended chatbot.** It follows an attempt-aware pedagogical ladder and is restricted to curriculum-linked concepts and citations.
4. **The concept graph is not decorative visualization.** It connects a detected error to prerequisites, related concepts, historical evidence, and teacher action.
5. **The teacher dashboard is not vanity analytics.** It answers: *which learners need which intervention, based on what evidence, right now?*
6. **Offline is not a slogan.** PRISM is designed around a local queue, cached text-first content, idempotent sync, and visible sync status.

---

# Main deck

## Slide 1 — Title

### On-slide copy

# PRISM
## Personalized Remediation and Intelligent Scaffolding for Mastery

**From “I am stuck” to a clear next step.**

Adaptive microlearning + evidence-grounded doubt resolution for mixed-ability Grade 8 classrooms.

**TetraTHON 2026 · EdTech Track**  
[Team name] · [Names] · [GitHub QR / repository URL]

### Visual direction

Use the PRISM learning orbit / concept graph identity on a dark forest background. The orbit should evolve visually from uncertain scattered signals into one highlighted learning path.

### Speaker notes

“PRISM is not another answer bot. It is an evidence loop for a real classroom: first identify the learner’s starting point, then teach the smallest useful next step, resolve the concept beneath a doubt, and give the teacher an intervention they can act on.”

---

## Slide 2 — The problem we are solving

### On-slide copy

# One grade. Many starting points.

In one Grade 8 classroom:

- Learners enter the same lesson with **different prerequisite gaps**.
- A single digital path is either too slow, too hard, or too shallow for many of them.
- STEM doubts compound when a learner receives an answer without repairing the underlying concept.
- Teachers cannot inspect every learner’s misconception pattern in real time.
- Always-online products fail at the point of need when bandwidth is weak or intermittent.

> **The real problem is not content scarcity. It is deciding the next learning action from limited evidence.**

### Visual direction

Show one class splitting into three **learning starting points**—not “weak / average / topper.” Label the paths **Foundational**, **Grade-Level**, and **Advanced**.

### Speaker notes

“Most tools begin with the chapter. PRISM begins with evidence. Two students can ask the same equation question for different reasons: one may not understand inverse operations; another may make a sign error; a third may simply need a check. Giving all three the same explanation wastes time and hides the real barrier.”

### Evidence footer

World Bank’s April 2024 India Learning Poverty Brief reports that, using the latest pre-COVID data, **56% of children in India at late primary age were unable to read and understand a simple text**. This does not directly measure Grade 8 mathematics; it is used here as evidence that learning gaps are systemic and that grade placement alone is insufficient. [R2]

---

## Slide 3 — Why current approaches break

### On-slide copy

# Why a generic chatbot or one-size-fits-all LMS is not enough

| Typical approach | What it misses | PRISM response |
|---|---|---|
| Same lesson for every learner | Starting point and prerequisite readiness | Short diagnostic + differentiated entry path |
| Generic “ask AI” chat | The concept beneath the question | Taxonomy-linked root-gap hypothesis |
| Correct / incorrect score only | *Why* the learner answered that way | Misconception tags + evidence ledger |
| Dashboard with completion only | What the teacher should do next | Ranked intervention recommendation |
| Cloud-only delivery | Classroom connectivity constraints | Cached text-first learning + queued sync |

**Design principle:** Technology should **augment teacher judgment**, not silently replace it.

### Speaker notes

“UNESCO warns that technology must be evaluated for relevance, equity, scalability, and sustainability—not novelty. PRISM therefore keeps the high-stakes educational logic visible: the system shows the concept, evidence, uncertainty, and recommended action. The teacher remains the decision-maker.”

### Evidence footer

UNESCO’s 2023 Global Education Monitoring Report frames technology in education through relevance, equity, scalability, and sustainability, and cautions that technology should complement—not substitute for—teacher interaction. [R3]

---

## Slide 4 — Our solution in one loop

### On-slide copy

# PRISM: Observe → Map → Guide → Verify

```text
OBSERVE                 MAP                    GUIDE                    VERIFY
5-question probe   →    concept + error    →   micro-lesson /      →   transfer check,
answer, time,           evidence model         tutor scaffold           updated mastery
confidence, doubt       + uncertainty           + practice                + teacher signal
```

### The product promise

**Every recommendation answers four questions:**

1. **What should this learner do next?**
2. **What evidence led to that recommendation?**
3. **How certain is PRISM?**
4. **What should the teacher do if the learner remains stuck?**

### Visual direction

Use a four-stage animation / diagram. A learner answer flows into a tagged concept graph, becomes a 10-minute path, then returns a transfer-check signal to both learner and evaluator.

### Speaker notes

“The loop is deliberately closed. We do not diagnose once and permanently label a learner. Every practice response can refine the next action. That makes the initial five questions a starting signal rather than a fixed identity.”

---

## Slide 5 — Requirement coverage: the full system

### On-slide copy

# One integrated prototype. Two connected experiences.

| Learner experience | Evaluator experience |
|---|---|
| 5-question diagnostic | Level distribution and completion status |
| Foundational / Grade-Level / Advanced path | Common error-pattern clusters |
| 10-minute personalized micro-lesson | Learner-level evidence and likely blocker |
| 3 embedded practice questions + instant feedback | Recommended short intervention |
| Text doubt + optional handwritten-photo intake | Offline/pending-sync visibility |
| Socratic or direct explanation | Cohort trends, not public learner ranking |
| Concept graph + session history | Evidence-led follow-up |

**PRISM does not create a second system for teachers.** Learner interactions produce the teacher’s intervention signal.

### Speaker notes

“This directly maps to every expected outcome in the problem statement. The key architectural choice is that the dashboard is derived from the same learner evidence, not manually maintained or filled with fake analytics.”

---

## Slide 6 — The 5-question diagnostic: small, explainable, revisable

### On-slide copy

# Five signals to choose a better beginning

**Showcase unit: Grade 8 Mathematics — Linear Equations in One Variable**

| Probe signal | Example skill tested | Why it matters |
|---|---|---|
| Q1: Number sense | `−7 + 12 = ?` | Detects integer-operation readiness |
| Q2: Equality meaning | Which values keep `x + 5 = 12` balanced? | Checks “equation as balance,” not memorized steps |
| Q3: One-step inverse operation | Solve `x − 8 = 15` | Tests inverse-operation selection |
| Q4: Multi-step structure | Solve `3x − 5 = 16` | Reveals whether learner stops before isolating `x` |
| Q5: Transfer / check | Is `x = 7` valid for `2x + 4 = 18`? Why? | Tests substitution and explanation |

### Classification policy (present as a transparent rule, not a black box)

- **Foundational:** prerequisite signal is missing or evidence is inconsistent → begin with equality and inverse operations.
- **Grade-Level:** core procedure is present but one misconception/error pattern is evident → begin with targeted repair and grade-level application.
- **Advanced:** independently solves and explains transfer item → begin with variation, modeling, or extension.
- **Insufficient evidence:** low confidence, skipped items, or conflicting signals → ask one clarifying item; do **not** over-label.

### What PRISM stores for each response

`answer · correctness · error tag · time band · hint use · self-reported confidence · concept IDs · timestamp`

### Speaker notes

“Five questions are intentionally short because the objective is not to produce a high-stakes ranking. They select a starting route. We make this decision explainable and revisable, and we reserve an ‘insufficient evidence’ state rather than pretending the model is certain.”

### Research rationale

NEP 2020 explicitly supports formative/adaptive assessment to track and individualize each student’s learning. PRISM operationalizes this as a brief, low-stakes starting probe followed by ongoing evidence—not a one-time examination. [R4]

---

## Slide 7 — Three microlearning paths: 10 minutes that lead somewhere

### On-slide copy

# Same curriculum goal. Different next step.

| Path | 10-minute lesson shape | 3 embedded practices | Completion condition |
|---|---|---|---|
| **Foundational** | Equality-as-balance visual → inverse operation worked example → guided self-explanation | one-step equation; identify operation; check solution | 1 independent transfer response or a clear retry recommendation |
| **Grade-Level** | Multi-step equation worked example → identify a common stopping error → guided repair | solve multi-step; error analysis; contextual application | correct strategy on transfer item |
| **Advanced** | Compare two valid solution paths → model a word problem → justify/check efficiency | multi-step variation; create an equation; explain why a method works | explanation + independent application |

### Non-negotiable learning design

**Worked example → self-explanation prompt → independent attempt → immediate feedback → next-step choice**

**Feedback is specific:**

> “You correctly added 5 to both sides. `x` is still multiplied by 3—what inverse operation is left?”

Not: “Incorrect. Try again.”

### Speaker notes

“Differentiation is more than an easier question bank. The amount of scaffolding, representation, and transfer demand changes by path, while the destination remains curriculum-aligned. The learner is never placed into a permanent track: a later correct independent transfer can move them forward.”

### Research rationale

Research summarized in ERIC reports that combining worked examples with self-explanation prompts improves mathematical procedural learning relative to traditional problem solving alone in the cited study context. This is why PRISM’s micro-lesson uses explanation prompts, not passive video consumption. [R5]

---

## Slide 8 — Doubt resolution: identify the concept beneath the question

### On-slide copy

# Do not only answer the doubt. Repair its root cause.

### Learner inputs

- **Text:** “I added 5, but why can’t I stop at `3x = 21`?”
- **Optional handwritten photo:** learner captures a notebook problem.

### PRISM’s grounded pipeline

```text
Text / photo
   ↓
OCR or transcription candidate → learner confirms extracted question
   ↓
Curriculum-scoped concept retrieval
   ↓
Attempt pattern + prerequisite graph + question context
   ↓
Root-gap hypothesis + confidence / uncertainty
   ↓
Socratic or direct scaffold + cited lesson source
   ↓
Transfer check and graph update
```

### Root-gap example

| Surface doubt | Likely root concept | Evidence | First useful response |
|---|---|---|---|
| “Why is `3x = 21` not the final answer?” | **Inverse operations / isolating the variable** | Learner removed constant but repeatedly did not divide coefficient | “Is `x` alone yet? What operation reverses multiplying by 3?” |

### Critical safeguard

**OCR text is never silently treated as truth.** The learner sees and confirms/corrects the extracted question before PRISM reasons over it.

### Speaker notes

“Computer vision has a narrow role: it assists transcription. It does not diagnose mathematical understanding by looking at handwriting alone. Diagnosis combines the confirmed question with known concept relationships and the learner’s actual attempt evidence.”

---

## Slide 9 — Tutor behavior: a teaching policy, not uncontrolled chat

### On-slide copy

# The tutor escalates help only when the learner needs it

| Learner state | PRISM mode | Example behavior |
|---|---|---|
| First attempt | **Socratic hint** | “What must happen to both sides before `x` is alone?” |
| First incorrect attempt | **Explain error** | “You removed 5 correctly, but `x` is still multiplied by 3.” |
| Second incorrect attempt | **Worked step** | “From `3x = 21`, divide both sides by 3: `x = 7`.” |
| Third incorrect attempt or “show me” | **Direct explanation** | Full curriculum-linked worked solution |
| After explanation | **Check thinking** | Isomorphic transfer question; learner must apply it independently |

### Tutor contract

- Uses only the active **grade, subject, concept, prerequisite, and authored lesson scope**.
- Returns a structured response: **mode, concept IDs, curriculum citations, confidence, next action**.
- Rejects unsupported factual claims, unknown concept IDs, or a “high confidence” claim when evidence is weak.
- Has a deterministic authored hint/feedback fallback if the LLM is unavailable.

### Speaker notes

“The LLM is optional phrasing assistance, not the source of truth. The teaching policy and the concept model remain deterministic and inspectable. This keeps PRISM useful offline and protects the user from confident but ungrounded explanation.”

### Evidence footer

UNESCO’s GenAI guidance highlights the need for human-centred governance, privacy protection, and validation in education. PRISM responds by using constrained, cited generation only after an authored/deterministic fallback exists. [R6]

---

## Slide 10 — Concept graph + mastery history: make learning evidence visible

### On-slide copy

# A resolved doubt should change what happens next

### Concept graph example

```text
Integer operations ──► Equality as balance ──► Inverse operations ──► Multi-step equations
                                │                       │
                                │                       └──► Checking a solution
                                └── related weak area
```

### What a concept node shows

- **Mastery state:** needs prerequisite support / developing / likely ready for transfer
- **Evidence:** independent correct responses, hint-assisted responses, recent misconception tags
- **Recency:** when evidence was last observed
- **Uncertainty:** low / medium / high
- **Action:** revisit, practice, transfer check, or teacher support

### Learner-facing wording

| Evidence band | Learner sees | Teacher sees |
|---|---|---|
| Limited evidence | “Let’s rebuild this idea.” | “Needs prerequisite repair.” |
| Developing evidence | “Getting there—one more check.” | “Developing; evidence still limited.” |
| Independent transfer evidence | “Ready for the next challenge.” | “Likely mastered; confirm with transfer item.” |

### Speaker notes

“We avoid calling students weak, slow, or behind. PRISM talks about the evidence around a concept. A score without a reason can stigmatize; an evidence ledger creates a fairer conversation and tells the learner how to move forward.”

---

## Slide 11 — Evaluator dashboard: from data to a 2-minute intervention

### On-slide copy

# The teacher view answers: “Who needs what, based on what evidence, now?”

### Cohort command view

- Learners by current **Foundational / Grade-Level / Advanced** starting route
- Active, completed, and **offline-pending** learning sessions
- Top misconception clusters by **affected learners, repeat rate, recency, downstream risk, and trend**
- One ranked intervention recommendation—not a wall of charts

### Student intervention card — illustrative anatomy

```text
Learner: [Pseudonymous learner]
Current path: Grade-Level
Current target: Multi-step equations
Likely blocker: Inverse operations · confidence: medium
Evidence: repeated “stops before dividing coefficient” pattern
Recommended 2-minute action: Ask the learner to solve 3x = 21 on a mini-whiteboard
Sync: 2 local attempts pending upload
```

### Cluster intervention card — illustrative anatomy

```text
Cluster: Stops before dividing the coefficient
Concept: Inverse operations
Why it matters: prerequisite for multi-step equations
Suggested teacher move: “In 3x = 21, is x alone yet? What undoes ×3?”
```

### Speaker notes

“Completion rate alone does not tell a teacher what to do. PRISM surfaces a manageable instructional action. It never publicly ranks learners; teacher information is role-protected and the language stays evidence-based.”

---

## Slide 12 — Offline-first, low-bandwidth architecture

### On-slide copy

# Useful before the network is perfect

```text
Learner PWA
  ├─ cached app shell + text-first micro-lessons
  ├─ local concept / question bundle for active unit
  ├─ IndexedDB outbox: attempts, doubt metadata, progress events
  └─ visible state: synced / saved locally / needs attention
              │ when connection returns
              ▼
FastAPI service
  ├─ deterministic diagnostic, misconception, and mastery logic
  ├─ curriculum-scoped tutor orchestration
  └─ idempotent event reconciliation
              ▼
PostgreSQL
  ├─ curriculum sources, concepts, attempts, mastery history
  └─ teacher read models / intervention clusters
              │ optional and bounded
              ▼
LLM augmentation
  └─ cited, schema-validated explanation phrasing only
```

### Why these choices are credible

- **PWA + cached content:** useful during poor connectivity; avoids a video-heavy dependency.
- **Text-first micro-lessons:** low data cost and quick first paint; images only where they improve understanding.
- **Local outbox:** learner work is not discarded when the network fails.
- **Idempotent events:** a retried sync cannot duplicate an attempt or inflate mastery.
- **PostgreSQL as source of truth:** durable, auditable learner and curriculum evidence.
- **LLM is optional:** core diagnosis and authored fallback remain available without external inference.

### Speaker notes

“Offline capability is an architecture, not a cache checkbox. The team must show the state visibly: what is saved locally, what is synced, and what needs attention. This makes the prototype honest and operationally meaningful.”

---

## Slide 13 — Trust, safety, privacy, and fairness

### On-slide copy

# Trust is a feature—not a footer

| Risk | PRISM control |
|---|---|
| Overconfident diagnosis from five answers | Confidence state + “insufficient evidence” path + revisable placement |
| Hallucinated tutor explanation | Curriculum-scoped retrieval, citation IDs, schema validation, deterministic fallback |
| Tutor gives answer too early | Fixed escalation ladder: hint → error explanation → worked step → direct explanation → transfer check |
| OCR misreads handwriting | Learner confirmation before diagnosis |
| Learner labeling / public comparison | Evidence-based wording; role-protected teacher views; no public ranking |
| Personal data exposure | Data minimization, pseudonymous demo data, least-privilege roles, no secrets in the client |
| Connectivity loss | Local queue and visible sync state; eventual idempotent reconciliation |

### Prototype boundary statement

> **PRISM is a hackathon prototype. It demonstrates the complete decision model and user journey; any feature not verified in the deployed build is labelled as planned product direction, not live capability.**

### Speaker notes

“This slide separates a serious education product from a polished but untrustworthy demo. We make uncertainty visible, preserve teacher agency, and do not use fake accuracy claims.”

---

## Slide 14 — Market fit: start where the workflow already exists

### On-slide copy

# A classroom intervention layer—not a replacement LMS

### Initial users

1. **Grade 8 learners:** immediate, non-judgmental support when stuck.
2. **Subject teachers / tutors:** a short list of evidence-backed interventions instead of manual error hunting.
3. **Schools, tutoring centres, and bridge-learning programs:** curriculum-aligned remediation that can operate under constrained connectivity.

### Initial deployment wedge

**One grade + one subject + one high-leverage concept family**  
Grade 8 Mathematics → linear equations → prerequisite repair + doubt resolution.

### Why this can scale responsibly

- New units are added as **authored curriculum packs**: concepts, prerequisites, diagnostic items, misconceptions, lesson cards, hint ladders, citations.
- The platform architecture is reusable; only the pedagogical content graph changes per subject/unit.
- It remains useful without paid LLM calls because the core loop is deterministic and authored.
- Teacher recommendations make it fit into existing instruction rather than asking teachers to abandon their classroom workflow.

### Speaker notes

“We are not claiming to solve all Indian education on day one. We start with a narrow, measurable use case and a content-authoring model that makes expansion traceable. That is a more credible path to scale than an empty ‘AI for every subject’ pitch.”

---

## Slide 15 — Why PRISM wins

### On-slide copy

# PRISM turns evidence into action

| PRISM differentiator | Why it matters to the user |
|---|---|
| **Starting-point diagnosis, not a one-size-fits-all lesson** | Learners get an appropriate first action quickly |
| **Root-gap reasoning, not only an answer** | Doubts repair misconceptions instead of repeating them |
| **Attempt-aware scaffolding** | Help is calibrated; answers are not revealed prematurely |
| **Evidence graph with uncertainty** | Learners and teachers can understand the recommendation |
| **Teacher intervention board** | The product creates a class-level action, not just more data |
| **Offline-first direction + deterministic fallback** | The learning loop remains useful when network or LLM access fails |
| **Curriculum citations and safety controls** | AI support is grounded, inspectable, and safer for schools |

## Closing line

> **PRISM makes the next learning step clear—for the learner who is stuck and the teacher responsible for the whole room.**

### Visual direction

Return to the PRISM orbit, now resolved into a clear highlighted path that ends in a teacher-action card.

### Speaker notes

“PRISM’s moat is not a chat interface. It is the accountable loop from learner evidence to targeted practice to a teacher action, with each step explainable and resilient to constrained connectivity.”

---

# Appendix / demo support

## Slide 16 — Demo script: a judgeable 90-second journey

### On-slide copy

# One learner. One doubt. One clear next step.

### Demo sequence

1. **Diagnostic (20 sec):** learner answers five questions in Grade 8 linear equations.
2. **Decision (10 sec):** PRISM explains: “Start with inverse operations because you removed the constant correctly but did not isolate the variable.”
3. **Micro-lesson (20 sec):** learner sees a short worked example plus a self-explanation prompt.
4. **Practice + feedback (15 sec):** learner stops at `3x = 21`; PRISM identifies the exact next operation.
5. **Doubt resolution (15 sec):** learner asks “Why can’t I stop here?”; tutor gives a Socratic prompt, then escalates only if needed.
6. **Teacher action (10 sec):** dashboard shows an inverse-operations misconception cluster and a 2-minute intervention prompt.

### Presenter narration

> “In under two minutes, PRISM has not just marked an answer wrong. It has identified the likely concept gap, selected the smallest appropriate learning action, captured evidence, and translated a learner event into a teacher intervention.”

### Demo integrity rule

Use **verified local screenshots or a live local demo only.** If a route is incomplete, show a clearly labelled flow diagram instead of a fake product screen.

---

## Slide 17 — Delivery roadmap: what is already credible vs. what comes next

### On-slide copy

# Build the proof loop first

| Layer | Prescreening prototype proof | Next validation milestone |
|---|---|---|
| Curriculum model | Grade 8 NCERT-linked concept metadata across Mathematics, Science, English | Review / author a small expert-checked question bank per unit |
| Learner model | Deterministic scoring, misconception mapping, BKT-style mastery foundations | Persist real diagnostic attempts and verify updates end-to-end |
| Tutor | Structured modes, curriculum-grounded response contract, authored fallback design | Test full hint ladder and transfer check against reviewed content |
| Teacher view | Learner evidence, cohorts, clusters, intervention read model | Derive read model from actual learning events—not seed-only data |
| Offline | Architecture and event-sync design | Add PWA cache, IndexedDB outbox, idempotent reconciliation, and sync UI |
| LLM | Optional bounded/cited augmentation direction | Add only after deterministic fallback, citations, learner controls, and safety tests |

### Speaker notes

“Judges should see a disciplined build order: the educational decision loop before the generative layer. We will not treat an LLM response as proof of learning. We first prove the diagnostic-to-remediation-to-teacher-action flow with deterministic, curriculum-linked logic.”

---

## Slide 18 — Requirement traceability matrix

### On-slide copy (appendix)

| Exact TetraTHON expected outcome | PRISM implementation / deck proof |
|---|---|
| **5-question diagnostic probe** with automatic level classification (**Foundational / Grade-Level / Advanced**) | Slide 6: five explicit linear-equation probe signals; transparent, revisable classification policy |
| **Three differentiated content paths** with **10-minute micro-lessons**, **3 embedded practice problems**, and **instant feedback per path** | Slide 7: path-by-path lesson shape, practice design, completion condition, feedback example |
| **Evaluator dashboard:** per-student level, completion rate, and common error patterns; **offline-capable or low-bandwidth-friendly architecture** | Slides 11–12: cohort command view, intervention cards, local queue, sync state |
| **Question intake via text and optional image (handwritten problem photo)** with **root concept-gap identification** | Slide 8: OCR/transcription confirmation + concept/requisite/evidence pipeline |
| **Step-by-step explanation engine (Socratic or direct)** with **concept graph visualisation of resolved and related weak-area nodes** | Slides 9–10: escalation ladder and concept graph |
| **Session history with mastery progression indicators per concept node; optional LLM-powered explanation with curriculum citation** | Slides 9–10: evidence ledger, uncertainty, structured cited tutor output, deterministic fallback |
| **Understanding of the Problem Statement** | Slides 2–3: classroom, doubt, teacher workload, connectivity framing |
| **Proposed Approach:** methodology, intended tech stack, workflow, and design reasoning | Slides 4–13: end-to-end loop, architecture, safeguards, design rationale |
| **Market Fit & Real-World Relevance:** viable, scalable, impact-driven | Slides 14–15: user groups, narrow deployment wedge, authorable curriculum packs, deterministic core |

---

# Research rationale: solution decisions, not generic feature claims

## A. Why a short diagnostic can be credible

A five-item probe cannot validly measure all of a learner’s ability. PRISM should never claim that it does. Its job is narrower: select a **provisional next learning path** from a limited set of prerequisite signals. That decision becomes more reliable as the learner works, makes mistakes, uses hints, and completes transfer checks.

### Recommended decision rule

```text
Input: 5 diagnostic responses + response confidence + hint/skip flags

1. Map each item to one or more prerequisite / target concept IDs.
2. Detect correct, incorrect, and recognizable misconception-pattern evidence.
3. Estimate path readiness with a transparent weighted rule.
4. If evidence conflicts or is sparse, return “insufficient evidence” and a short clarifying item.
5. Log the rationale, confidence, and alternatives.
6. Update placement after independent practice and transfer—not just diagnostic score.
```

### Why this is stronger than “AI assessment”

- It is inspectable by a teacher.
- It avoids using a student label as a permanent identity.
- It works without an LLM.
- It aligns with formative/adaptive assessment language in NEP 2020. [R4]

---

## B. Why the micro-lesson uses worked examples and self-explanation

A learner who repeatedly makes a procedural error rarely benefits from more identical problems. PRISM should first make the relevant structure visible, ask the learner to articulate it, and then test independent application.

### Recommended 10-minute sequence

| Time | Learning action | System evidence collected |
|---|---|---|
| 0:00–1:00 | State the exact objective in learner language | selected concept / starting confidence |
| 1:00–3:00 | Annotated worked example | viewed / replayed step |
| 3:00–4:30 | Self-explanation prompt | explanation choice / text / uncertainty |
| 4:30–7:30 | Two scaffolded practice items | answer, error tag, hint use |
| 7:30–9:00 | One independent transfer item | independent correctness |
| 9:00–10:00 | Clear next action | mastery update + revisit / continue / teacher signal |

### Content rule

Every practice item must include:

- concept ID;
- expected answer / rubric;
- common error patterns;
- feedback linked to the error;
- hint ladder;
- source/citation ID;
- a transfer check where appropriate.

This design is supported by research on worked examples plus self-explanation in mathematics; it must be presented as an evidence-informed design choice, not a universal learning guarantee. [R5]

---

## C. Why root-gap detection must be curriculum-scoped

“Explain this question” is not enough. A generic model may give a fluent explanation of the surface problem while missing the prerequisite barrier. PRISM’s root-gap hypothesis needs four bounded inputs:

1. **The confirmed question** (typed or OCR-transcribed and learner-verified).
2. **The learner’s attempt / answer** and identifiable error pattern.
3. **A subject taxonomy / concept graph** with prerequisites.
4. **The learner’s recent concept evidence.**

### Root-gap confidence policy

| Confidence | What PRISM may do | What PRISM must not do |
|---|---|---|
| High | Give a targeted scaffold and show cited evidence | Claim the learner has a fixed deficit |
| Medium | Offer the likely concept and a short confirmation question | Pretend the diagnosis is certain |
| Low | Ask clarifying question / offer direct foundational review | Generate a specific diagnosis or teacher alert as fact |

---

## D. Why the teacher dashboard uses intervention clusters

A teacher has limited time. A dashboard should reduce—not create—interpretive work.

### Cluster ranking policy

```text
impact(cluster) =
  0.42 × affected distinct learners / active learners
+ 0.22 × recent incorrect rate
+ 0.18 × repeat-error rate
+ 0.10 × downstream dependency risk
+ 0.08 × recent trend growth
```

The exact weights can evolve after classroom testing. The hackathon prototype should show the **logic and components** of the ranking, not claim that the weights are scientifically final.

### Teacher-facing output must always include

- the concept / misconception;
- affected learner count or band (never public ranking);
- concrete evidence pattern;
- confidence / recency;
- a short intervention move;
- the expected follow-up signal.

---

## E. Why PRISM uses a bounded LLM rather than an LLM-first product

### LLM allowed role

- Rephrase an authored, curriculum-linked explanation for learner language.
- Generate a Socratic question from supplied concept / prerequisite / source chunks.
- Respond in a structured schema with citations and a defined next action.

### LLM prohibited role

- Invent curriculum facts or citations.
- Infer a learner’s profile from ungrounded chat alone.
- Override deterministic diagnostic / mastery logic.
- Give the final answer when the learner is at the hint stage.
- Act as the only learning path when the network fails.

### Fallback behavior

If LLM access fails, PRISM serves the question’s authored `hint_ladder`, error-specific feedback, and transfer question. The experience becomes less conversational—not broken.

---

# Claim policy for the PPT and live evaluation

## Safe wording for implemented / verified behavior

Use only when verified in the currently running build:

- “PRISM **demonstrates** …”
- “The prototype **stores / retrieves / renders** …”
- “In our local demo, the system **returns** …”
- “This flow is backed by …”

## Safe wording for planned or partially implemented product direction

Use when a feature is architected or designed but not fully verified:

- “PRISM is **designed to** …”
- “The next implementation layer **adds** …”
- “Our offline design **uses / will use** …”
- “The optional LLM layer is **bounded by** …”
- “The production roadmap **requires** …”

## Never say

- “Our AI accurately diagnoses every student.”
- “Five questions determine a learner’s level.”
- “Offline works” unless cache + outbox + sync have been tested.
- “The LLM understands the student” or “never hallucinates.”
- “Personalized” without showing the evidence and decision logic.
- Any customer, adoption, accuracy, time-saved, or impact number without a real source and its context.

---

# Final pre-submission checklist

## Content

- [ ] Cover includes TetraTHON 2026, EdTech track, team, and public GitHub QR.
- [ ] Every expected outcome from the booklet is traceable in Slide 18.
- [ ] Presentation uses the **Grade 8 Linear Equations** journey consistently.
- [ ] Five diagnostic questions are present as reviewed content, not filler questions.
- [ ] Three paths are pedagogically different—not merely color-coded difficulty labels.
- [ ] The tutor example follows the escalation ladder and includes a transfer check.
- [ ] Teacher card names an intervention, evidence, and uncertainty.
- [ ] Offline is shown as cache + queue + reconciliation + status, not as an unsupported claim.
- [ ] Each research statistic/claim has an exact source in the references.

## Product/demo integrity

- [ ] Replace all `[Team name]`, `[Names]`, and GitHub placeholders.
- [ ] Use only verified screenshots from the current local build.
- [ ] Label illustrative diagrams and examples clearly.
- [ ] Do not use production-looking fake learner analytics.
- [ ] Use pseudonymous learners in any demo data.
- [ ] Test the local launch and health endpoint before presenting.
- [ ] Prepare a no-network backup: locally cached screenshots + recorded screen capture only if live demo is not guaranteed.
- [ ] GitHub repository is public only after secrets, `.env`, and local database artifacts are excluded.
- [ ] Show visible, meaningful Git commits; do not manufacture commit history.

## Presentation craft

- [ ] One main claim per slide.
- [ ] Keep on-slide text to 30–60 words where possible; say the rest.
- [ ] Use the same visual system: deep forest background, mint signal, yellow evidence/action accent.
- [ ] Use accessibility-conscious contrast and avoid tiny source text.
- [ ] Close on the learner-to-teacher evidence loop, not a generic “thank you.”

---

# References

**[R1] TetraTHON 2026 Prescreening Problem Statement Booklet.** Local source supplied by the team: `TetraTHON_2026_ProblemStatements.pdf`, EdTech pages 4 and 6. Required outcomes, evaluation criteria, and prescreening submission rules.

**[R2] World Bank. _India Learning Poverty Brief_, April 2024.**
https://documents1.worldbank.org/curated/en/099090524113131044/pdf/P17920918dbd990091900117c6f4b92d182.pdf

**[R3] UNESCO. _Global Education Monitoring Report 2023: Technology in Education—A Tool on Whose Terms?_**
https://gem-report-2023.unesco.org/

**[R4] Ministry of Education, Government of India. _National Education Policy 2020._**
https://www.education.gov.in/sites/upload_files/mhrd/files/nep_update/National_Education_Policy_2020_en.pdf

**[R5] ERIC. _The Effect of Worked Examples and Self-Explanation Prompts on Students’ Learning of Algebra_, 2023.**
https://eric.ed.gov/?id=EJ1447367

**[R6] UNESCO. _Guidance for Generative AI in Education and Research_, 2023.**
https://unesdoc.unesco.org/ark:/48223/pf0000386693

**[R7] NCERT. _Mathematics Textbook for Class VIII (2024–25 reprint)._**
https://ncert.nic.in/textbook/pdf/hemh1ps.pdf

**[R8] NCERT. _Bridge Programme: Mathematics, Grade 8._**
https://ncert.nic.in/pdf/Bridge_Programme/Grade8/Bridge_Programme-Mathematics-Grade_8.pdf

---

## Source-use notes

- R2 is used only to establish the broad context of learning gaps in India; do not imply it measures PRISM’s target unit or project impact.
- R3 and R6 support the product principles of equity, human agency, privacy, validation, and responsible AI—not performance claims about PRISM.
- R5 supports the instructional design choice of worked examples and self-explanation; do not overgeneralize it into a guaranteed effect size for every learner.
- R7/R8 anchor the Grade 8 showcase scope. Before publicly publishing individual question wording, have a subject teacher review the final items and citations.
