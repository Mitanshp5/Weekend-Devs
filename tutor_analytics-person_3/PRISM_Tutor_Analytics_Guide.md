# PRISM — Tutor Analytics Guide

### Tutor Orchestrator · Progress Evidence · Teacher Intervention Board

This is the "understand it before you build it" version of your slice of
PRISM. It leans on `SPEC_TUTOR_ANALYTICS.md` for exact schemas/formulas — this
file is about _why_ each piece exists and _what_ "done" looks like.

---

## The big picture: why your part matters most for judges

The playbook is blunt about this: a generic chatbot that answers questions is
not a differentiator. What judges will actually remember is **seeing the
reasoning** — why the system thinks a student is stuck, what evidence backs
that, and what a teacher should do about it. Your three pieces (tutor,
progress evidence, teacher board) are exactly the parts that make that
reasoning _visible_. The Learner Model and Diagnosis Engine (someone else's
scope) compute the numbers; you're building the surface that turns those
numbers into something a student and a teacher can actually act on.

One rule sits under everything you build: **the tutor never decides anything
by itself.** It never changes a mastery score, never invents a root-gap
diagnosis, never gets to skip a step because it "sounds right." It only
receives already-computed state (from the Diagnosis Engine / Learner Model)
and turns it into language, or displays it as evidence. If you remember only
one thing from this doc, remember that boundary — it's what keeps the system
honest and it's what the playbook calls the "core loop works with no LLM"
requirement.

---

## Part 1 — Tutor Orchestrator

### What it actually does

Given a student's current attempt (right, wrong, or a typed/photographed
doubt) plus the diagnosis state that's already been computed elsewhere, the
tutor decides _how to talk to the student_ — not what's true about their
knowledge. Think of it as a language layer sitting on top of already-decided
facts.

### The four structured modes, mapped to the escalation ladder

The playbook defines a strict attempt-by-attempt ladder. Your four modes
(hint, explain error, worked step, check thinking) are that ladder:

| Attempt                              | Mode                   | What it does                                                                                      |
| ------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------- |
| 0 (first try)                        | **Socratic hint**      | Ask a focused thinking question — never give anything away                                        |
| 1st wrong                            | **Explain error**      | A conceptual hint tied to the specific misconception tag from the rubric                          |
| 2nd wrong                            | **Worked step**        | Show the relevant operation or a visual reasoning step                                            |
| 3rd wrong, or student says "show me" | **Direct explanation** | Full worked explanation                                                                           |
| Right after direct explanation       | **Check thinking**     | One isomorphic transfer question — mandatory. An explanation with no new evidence proves nothing. |

Notice the ladder only escalates — it never jumps straight to "worked step"
just because that seems faster. Skipping levels defeats the point of a
Socratic tutor.

### The response has to be structured, not just a chat message

Every tutor turn returns a fixed shape, not free text:

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

Why this matters for you specifically: your frontend renders off
`response_mode` and `next_action`, not off parsing prose. And before you ever
show a response to the student, it has to pass validation — reject/retry the
LLM call if: it makes a factual claim with no `citation_ids` backing it; it
gives a final answer when the policy says hint-only; it references a concept
that doesn't exist in the graph; it claims high confidence when the upstream
diagnosis confidence was actually low; or the JSON just doesn't parse. That
validator is arguably the most important piece of code in your whole slice —
it's the thing standing between "grounded tutor" and "hallucinating chatbot."

### Grounding — where the tutor gets its facts

```
request → load active concept + direct prerequisites + authored lesson cards
        → filter to grade/subject/scope
        → retrieve top curriculum chunks from the vector index
        → hand the LLM only those cited chunks
        → generate the structured response above
        → validate it (see above)
        → render
```

For a single-topic hackathon scope (Linear Equations, Grade 8), don't
over-engineer this into a full RAG system. The corpus is small — a handful of
authored lesson cards. Loading "the current concept + its direct
prerequisites' cards" and handing those to the LLM directly is legitimate and
simpler than standing up a heavy retrieval pipeline for a corpus this size.

### The fallback — this is not optional

Per the playbook's non-negotiable #2, the tutor has to work with **no LLM and
no internet**. Concretely: every question already has an authored
`hint_ladder` and `feedback` text (see the question schema in the master
spec). When the LLM is unavailable — timeout, no network, quota — your
orchestrator serves the next line of the authored `hint_ladder` instead of a
Socratic-generated one. The student experience degrades from "personalized
phrasing" to "the same good hint, pre-written" — it never breaks. Build and
test this path _before_ you build the LLM path, not after, so you're not
retrofitting a fallback onto something that assumes the LLM always answers.

### What "done" looks like for this piece

The acceptance test from the playbook you're directly responsible for:
_"cited Socratic response validates against response schema."_ Practically:
feed it a fixed adversarial test set (ask for the answer outright,
prompt-injection hidden in doubt text, an irrelevant request, a request for
an unsupported fact, empty/garbled OCR text) and confirm every single one
either produces a valid, cited, policy-compliant response or correctly falls
back — never a confident wrong answer.

---

## Part 2 — Progress evidence history

### What "evidence," not "score," means here

The playbook is explicit: never show a mastery number as unquestionable
truth. What you're building is a way to show _why_ the system believes what
it believes — the evidence ledger, not just a percentage.

The record you're rendering already exists upstream (Learner Model's job to
compute, yours to display):

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

Your job is the presentation layer over a _history_ of these — one snapshot
per concept isn't "progress," a timeline of them is. Concretely: a
per-concept view that shows how `p_know` moved over time, annotated with
which attempts were independent vs. hint-assisted, and what error tags showed
up along the way. When a student or teacher clicks into a concept node
(§7.4/graph visualization in the master spec), this is what they should see —
never just a bare number.

### The wording layer

Reuse the exact bands from the master spec — don't invent your own copy:

| `p_know`                         | What the learner sees                     | What the teacher sees                          |
| -------------------------------- | ----------------------------------------- | ---------------------------------------------- |
| `< 0.40`                         | "Let's rebuild this idea."                | "Needs prerequisite repair."                   |
| `0.40–0.70`                      | "You are getting there — one more check." | "Developing; evidence still limited."          |
| `>= 0.70` + independent evidence | "Ready for the next challenge."           | "Likely mastered; confirm with transfer item." |

Two different audiences, two different tones, same underlying number — this
is a small but very visible piece of the "explainable" non-negotiable.

---

## Part 3 — Teacher intervention board

### The one question this whole board answers

_"Which students need which intervention, based on what evidence, right
now?"_ If a panel doesn't answer that, cut it.

### Three panels, in order of how a teacher would actually use them

**1. Cohort command center** — the "walk in and glance" view: how many
students are Foundational/Grade-Level/Advanced, who's active vs. offline-
pending, a concept heatmap (mastery + confidence + error rate together, not
mastery alone), the top misconception clusters right now, and a ranked
"intervene now" list.

**2. Student intervention card** — the drill-down once a teacher picks a
name:

```
Student: Aanya
Current path: Grade-Level
Current target: Multi-step equations
Likely blocker: Inverse operations (0.78 confidence)
Evidence: 3 recent attempts stopped after isolating the constant
Recommended action: 2-minute inverse-operation mini-whiteboard check
Status: 2 local attempts pending sync
```

Every field here is either evidence (attempts, confidence) or an action
recommendation — never a bare label like "weak student."

**3. Misconception cluster view** — the class-wide pattern, because fixing
one student's gap one at a time doesn't scale to a room of 30:

```
Cluster: Stops before dividing the coefficient
Affected: 9 / 24 learners
Trend: +18% today
Current concept: inverse operations
Suggested intervention: "Ask the class: in 3x = 21, is x alone yet?
What operation reverses ×3?"
```

### How a cluster gets ranked

```
impact(cluster) =
   0.42 * affected_distinct_learners / active_learners
 + 0.22 * recent_incorrect_rate
 + 0.18 * repeat_error_rate
 + 0.10 * downstream_dependency_risk
 + 0.08 * trend_growth
```

You don't need to compute this yourself if the Diagnosis/Analytics read model
already exposes it — but you do need to know what each term means well
enough to sort/filter/display it sensibly (e.g. surfacing the highest-impact
cluster first, not just the most recent one).

### The guardrail you must not skip

Never classify or display a student as "weak," and never produce a public
ranking of students. Use only the evidence-aware states: `insufficient
evidence`, `needs prerequisite support`, `developing`, `ready for extension`.
This isn't just a tone preference — the playbook calls it out as a fairness
requirement, and teacher-facing views must be role-protected (a student
should never be able to load another student's card).

### What "done" looks like for this piece

The acceptance test you own: _"synthetic persisted events change cohort
clusters and intervention ranking."_ Practically: seed a batch of fake
attempt events for a fake class, confirm the cohort heatmap and the
misconception cluster list actually move in response — not static
placeholder data.

---

## How this fits the build order

From the master spec's phases — your three pieces mostly land in:

- **Phase 2 (complete learning loop):** teacher dashboard _projections_ —
  get the panels rendering off real (not synthetic) persisted events first,
  before any LLM is involved.
- **Phase 4 (AI enhancement):** the tutor orchestrator itself — structured
  output schema, validator, the Socratic/direct policy state machine, and the
  authored fallback. Build the fallback path before the LLM path (see above).
- **Phase 5 (the actual 36-hour hackathon):** this is where you rehearse the
  3-minute demo flow end to end and make sure every one of your panels
  survives the airplane-mode test.

Build order matters here specifically because Phase 2's gate is "works
end-to-end without an LLM" — if you build the tutor's LLM path before its
fallback path, you'll fail that gate and have to retrofit anyway.
