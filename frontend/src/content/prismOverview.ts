export const diagnosticDetails = {
  questionCount: 5,
  pathLabels: ["Foundational", "Grade-Level", "Advanced"],
  lessonDuration: "10-minute",
  practiceCount: 3,
} as const;

export const journeyPhases = [
  { label: "Observe", description: "A five-question diagnostic gathers independent, hinted, and uncertain signals." },
  { label: "Map", description: "PRISM maps the response to a curriculum concept and a revisable learning path." },
  { label: "Guide", description: "A 10-minute micro-lesson and three embedded practice problems adapt the next step." },
  { label: "Verify", description: "Instant feedback and session evidence keep the route open to revision." },
] as const;

export const requiredOutcomes = [
  "Five-question diagnostic probe with Foundational, Grade-Level, and Advanced paths.",
  "Ten-minute personalized micro-lessons with three embedded practice problems and instant feedback.",
  "Text and optional handwritten photo doubt intake with OCR-assisted validation direction.",
  "Curriculum-taxonomy mapping to identify the root concept gap beneath a question.",
  "Learner-controlled hint, Socratic question, worked step, or direct explanation support.",
  "A concept graph with resolved concepts, related weak areas, session history, and mastery progression.",
] as const;

export const evaluatorCapabilities = [
  "Evaluator dashboard anatomy for learner level, completion rate, and common error patterns.",
  "Cohort misconception clusters, evidence summaries, and recommended interventions.",
  "Curriculum citations and reasoning traces designed for evaluator trust.",
] as const;

export const architecturePrinciples = [
  "Low-bandwidth text-first lessons and offline evidence queue direction with safe synchronization.",
  "PWA/web shell with PostgreSQL as durable learner and curriculum truth.",
  "Redis reserved for ephemeral cache and rate limiting, not durable learner state.",
  "Optional curriculum-grounded LLM augmentation with citations around deterministic, explainable logic.",
  "Privacy-conscious learner profiles and role-based views.",
] as const;

export const impactAudiences = [
  { audience: "Learners", value: "An appropriate starting point and immediate doubt support." },
  { audience: "Evaluators", value: "Evidence-led intervention instead of manual guesswork." },
  { audience: "Programs", value: "Curriculum-aligned delivery despite constrained connectivity." },
] as const;

export const prototypeDisclosure =
  "Hackathon prototype — this overview presents the complete product direction; implementation depth varies by module.";
