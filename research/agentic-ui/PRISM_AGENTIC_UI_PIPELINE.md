# PRISM agentic UX pipeline

## Purpose

This UI pattern makes PRISM's adaptive workflow **visible and reviewable** without pretending to expose a model's hidden reasoning. It is designed for the deterministic-first architecture already defined for PRISM.

## Pipeline used in the interface

1. **Observe** — capture an attempt or other learning evidence.
2. **Map** — connect that evidence to a target concept, a misconception pattern, and candidate prerequisite gaps.
3. **Guide** — select an authored next activity, hint, or explanation policy.
4. **Verify** — use a short check-for-understanding before updating mastery.

The UI presents these as user-facing product stages, not as a chain-of-thought transcript. A later implementation should show the evidence and explanation available for each decision, plus a learner/teacher correction path.

## Research translated into product choices

| Research finding | PRISM implementation choice |
|---|---|
| LangGraph documents stateful orchestration and human-in-the-loop control. | Make an adaptive recommendation inspectable and interruptible rather than silently autonomous. |
| Human–AI interaction guidance recommends clear capability boundaries, explanations of consequential actions, and efficient correction. | Every future reroute should show **what changed → evidence → suggested next step → learner choices**. |
| NIST frames transparency, accountability, explainability, and interpretability as trustworthy-AI characteristics. | Use calibrated language such as “possible gap” or “needs more evidence”; do not expose chain-of-thought or a fake certainty score. |
| UNESCO centers learner agency in educational AI. | The recommended path must be a default with alternatives—not a locked sequence. Teacher escalation and feedback controls need a visible home. |
| Motion documents declarative React animation, gestures, layout animation, and reduced-motion configuration. | Use Motion only to clarify signal → decision → path transitions; honor reduced motion globally. |
| Adaptive-learning research stresses diagnostic evidence and teacher trust. | Avoid fake mastery scores; show a map only when the backend has supporting evidence. |

## UX patterns to add as API support arrives

- **Mission card:** topic, what PRISM will adapt, duration, and a change-topic / not-now control.
- **Evidence rail:** a lightweight persistent stage rail with the current decision, its evidence, and what would change it.
- **Decision trace:** learner-readable rationale and correction actions (`review first`, `make it shorter`, `I already know this`, `ask a teacher`).
- **Hint ladder:** nudge → worked step → analogous example → direct answer only by deliberate escalation.
- **Evidence ledger:** visible history of recommendations and changes, supplied by API attempt events.

## Visual implementation references

- **particles.casberry.in:** informed the low-density animated PRISM particle field; implemented as ten Motion particles rather than a heavy full-screen WebGL simulation.
- **React Bits:** informed the spring-based flowing navigation surface and dome-like curriculum cards.
- **animos.app:** informed long, seamless motion loops instead of short distracting repeats.
- **styles.refero.design:** informed the quiet, high-contrast frosted-glass dashboard sidebar and restrained surface treatment.
- **manus.im:** informed an editorial hierarchy where the primary action and content remain clearer than the effects.

## Sources

- [LangGraph agent overview](https://langchain-ai.github.io/langgraph/agents/overview/) — stateful agent systems and human-in-the-loop control.
- [LangGraph.js API reference](https://langchain-ai.github.io/langgraphjs/reference/modules/langgraph.html) — orchestration, persistence, memory, and human-in-the-loop.
- [Amershi et al., Guidelines for Human-AI Interaction (CHI 2019)](https://dl.acm.org/doi/10.1145/3290605.3300233) — guidance across initial use, interaction, errors, and long-term adaptation.
- [Microsoft Human-AI Interaction guideline cards](https://www.microsoft.com/en-us/research/wp-content/uploads/2019/01/AI_Guidelines_Cards_PrintQuality.pdf) — correction and global-control patterns.
- [Google PAIR: Feedback + Control](https://pair.withgoogle.com/guidebook/chapters/feedback-and-controls) — user feedback as a correction mechanism.
- [NIST AI Risk Management Framework 1.0](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf) — transparency, accountability, and explainability framing.
- [UNESCO guidance for Generative AI in Education and Research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research) — learner agency and human-centred education.
- [Motion for React](https://motion.dev/docs/react) — declarative, performant UI motion.
- [MotionConfig](https://motion.dev/docs/react-motion-config) — reduced-motion configuration.
- [ACM: The Impacts of Adaptive Learning Technologies on K-12 Teachers](https://dl.acm.org/doi/10.1145/3713043.3727062) — teacher trust considerations around mastery and performance diagnostics.

## Guardrails

- Do not label a learner, infer a gap with certainty, or show a recommendation as evidence-backed until the database/API supplies the relevant attempt and concept data.
- Do not expose model private reasoning. Show the learner-visible evidence, confidence, and next action instead.
- Keep animation optional, interruptible, and reduced-motion aware.
