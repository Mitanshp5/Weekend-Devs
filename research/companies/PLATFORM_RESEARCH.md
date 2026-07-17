# Learning-platform research — public evidence only

**Purpose:** identify product and architecture patterns for TetraTHON 2026's EdTech prescreening. This is not a claim that proprietary internals, model weights, or production prompts are known.

**Research date:** 2026-07-16

## Evidence rules

- **Fact** = directly stated by a primary/public source.
- **Inference** = a reasonable design interpretation, clearly labelled.
- Internal systems, private retrieval pipelines, and production system prompts are not treated as public knowledge.

## 1. Duolingo — measurable proficiency + difficulty, then lesson selection

### Publicly disclosed facts

- Duolingo describes **Birdbrain** as a model that learns both learner knowledge and the difficulty of its language material.
- It estimates whether a particular learner will answer a particular exercise correctly.
- Its **Session Generator** selects from a broad pool of exercises using that learner-specific difficulty estimate.
- Duolingo says it also has a separate system that tracks how well a learner knows particular words; Birdbrain extends the learner model across more facets of language.
- Duolingo reports that it evaluates changes through A/B tests.
- A 2024 engineering article says individual challenge responses are ingested to estimate proficiency across grammar concepts.

### What this means for PRISM

Do **not** personalize merely on an overall score. Store the atomic event:

`student × item × concept × response × timestamp × attempt × hint-use`

Then derive a per-concept estimate and select the next item/path from it. A rules-first prototype can demonstrate this transparently without claiming Duolingo-scale ML.

### What is not public

Birdbrain's feature set, model architecture, parameters, training data, exact Session Generator algorithm, and any prompts behind generative features are not disclosed in the cited sources.

### Sources

- Duolingo, *Learning how to help you learn: Introducing Birdbrain!* (2020; modified 2024): https://blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/
- Duolingo, *Inside Engineering at Duolingo* (2024): https://blog.duolingo.com/unique-engineering-problems/
- Duolingo, *How Duolingo combines human expertise with powerful AI* (2022): https://blog.duolingo.com/how-duolingo-experts-work-with-ai/

## 2. Khan Academy / Khanmigo — curriculum-grounded personal context + pedagogical guardrails

### Publicly disclosed facts

- Khan Academy says Khanmigo is integrated with its content library and a learner's account.
- It says context may include the learner's courses, preferred language, and personal interests.
- Its stated tutor principles are meeting learners where they are, connecting interests to instruction, immediate feedback, and prompting self-explanation.
- Khan Academy publicly describes prompt-level design for tone, personality, question style, redirection of off-topic behavior, and moderation guardrails.
- It says prompts are tested against diverse user personas, revised from pilot feedback, and iterated after release.
- A concrete published iteration: feedback about repeated questions led to revised activity prompts emphasizing no repeated quiz questions and concise language.

### What this means for PRISM

The model should **not** receive an unconstrained "solve the homework" instruction. Give it a bounded teaching contract and verified context:

1. known curriculum concept and prerequisites;
2. the student's last response/error category;
3. learner band and allowed lesson facts;
4. response mode: Socratic first, direct explanation only after a defined threshold;
5. no final answer before an attempt where suitable;
6. safe fallback when context is insufficient.

The strongest product decision is a visible, auditable **teaching policy** plus a deterministic concept-mapping layer—not an undisclosed giant prompt.

### Important boundary on “system prompts”

Khan Academy discloses its process and several behavioural requirements, but not a complete production system prompt. Public gists claiming a prompt must be treated as unverified, version-specific artifacts—not authoritative evidence about the deployed product.

### Sources

- Khan Academy, *Khan Academy’s 7-Step Approach to Prompt Engineering for Khanmigo* (2023; page updated 2025): https://blog.khanacademy.org/khan-academys-7-step-approach-to-prompt-engineering-for-khanmigo/
- Khan Academy, Khan Labs / Khanmigo: https://www.khanacademy.org/khan-labs

## 3. Magoosh — focused test-prep workflow and visible progress signals

### Publicly disclosed facts

- Magoosh's school-facing material describes a student home area that navigates to lessons, practice questions, and a breakdown of prior performance.
- It describes notes, flagged items for later review, and related content in its adaptive-learning workflow.

### What this means for PRISM

For the initial production curriculum slice, retain the strong interaction pattern—not a speculative algorithm:

- a compact learner home;
- "continue from last session";
- per-concept performance and flagged misconceptions;
- an explicit next micro-lesson/review action.

### What is not public

No reliable public primary-source documentation was found for Magoosh's exact adaptive algorithm, learner-model schema, production architecture, or prompts. We must not invent them.

### Source

- Magoosh for Schools, *About Magoosh*: https://schools.magoosh.com/about-magoosh

## 4. Quizlet Q-Chat — conversational tutoring attached to bounded study material

### Publicly disclosed facts

- Quizlet described Q-Chat as an AI tutor using conversational/adaptive questions around relevant study material.
- The public launch material says Quizlet combined cognitive science and ML in its adaptive study activities and identified an OpenAI collaboration.

### What this means for PRISM

A tutor is much safer and more useful when it is grounded in the selected concept card/lesson instead of an unrestricted web-chat experience. PRISM should cite its internally authored curriculum cards in explanations.

### Sources

- Quizlet, *Q-Chat: Meet Your New AI Tutor*: https://quizlet.com/qchat?setId=62004509
- Quizlet, *Introducing Q-Chat*: https://quizlet.com/blog/meet-q-chat
- PR Newswire launch release (secondary distribution of company announcement): https://www.prnewswire.com/news-releases/quizlet-launches-q-chat-ai-tutor-built-with-openai-api-301759014.html

## Cross-platform observations

| Pattern | Evidence-backed lesson | PRISM decision |
|---|---|---|
| Fine-grained telemetry | Duolingo uses individual challenge outcomes; Kolibri/Oppia also store detailed learning logs/progress. | Log each answer and error, not just lesson completion. |
| Explicit concept model | Birdbrain estimates proficiency across grammar concepts; Khanmigo is content-library integrated. | Use a small, human-authored Class 8 concept/prerequisite graph. |
| Adaptive selection separate from explanation generation | Duolingo's learner model feeds lesson selection; Khan describes pedagogical prompt design. | Rules determine level/path and root gap; LLM is an optional explanation renderer. |
| Teacher visibility | The competition explicitly requests cohort signals. Mature platforms expose learner progress rather than only chat. | Show levels, completion, and error clusters with drill-down. |
| Offline resilience | Offline-first is a distinct platform concern, not an LLM capability. | Cache lessons, graph, event queue, and last-known mastery locally; synchronize only when available. |

## Additional verified operational patterns

### Offline and reconciliation

- Duolingo publicly describes **frontend prediction**: the client may predict completion/progress locally and later reconcile with the server. This validates the architecture pattern, but not an exact public cache scope or conflict policy.
  - Source: https://blog.duolingo.com/frontend-prediction/
- Quizlet's official mobile help says Flashcards can be used offline with recent/saved sets. It does **not** claim offline adaptive Learn mode or AI tools.
  - Source: https://help.quizlet.com/hc/en-us/articles/360030565412-Studying-offline-with-Quizlet-mobile-apps
- Khan Academy recommends Kolibri for offline Khan content; this is not evidence of offline Khanmigo tutoring.
  - Source: https://help.khanacademy.org/downloads

**PRISM decision:** cache a small concept package, lesson cards, local questions/hints, the graph, and append-only attempt events. Calculate provisional mastery locally; synchronize a compact event queue later. Label generative tutoring as online-only unless an on-device model is actually implemented.

### Teacher signals should produce an intervention, not merely an activity count

- Duolingo for Schools publicly exposes XP, time spent, and most recent assignment.
  - Source: https://blog.duolingo.com/duolingo-schools-equitable-learning/
- Khan Academy reports mastery/comprehension and learning time, including teacher drill-down.
  - Source: https://support.khanacademy.org/hc/en-us/articles/360031129891-What-reporting-options-are-available-on-Khan-Academy-for-teachers-to-track-student-performance
- Magoosh's school product describes pace, accuracy, engagement, and aggregate reports.
  - Sources: https://schools.magoosh.com/about and https://schools.magoosh.com/resource_hub/monitor-student-progress

**PRISM opportunity:** show *current concept*, *mastery/confidence*, *likely prerequisite gap*, *support recommendation*, and a cohort misconception cluster—not just completion.

## PRISM research conclusion

Build a **deterministic adaptive learning core** with an optional, bounded AI tutor:

`attempt telemetry → error taxonomy → concept-gap inference → learner-band/path selection → cited explanation policy → mastery update → teacher cohort view`

This is more credible for the prescreening rubric than a generic chatbot because every adaptation can be explained, demoed, and validated.
