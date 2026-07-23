/**
 * DiagnosticPage — Focused 5-question diagnostic workspace.
 *
 * State machine:
 *   idle → loading_question → answering → submitting → feedback → [next | results]
 *
 * Sequence targets one concept per step, progressing in prerequisite order:
 *   1. num.signed_operations   — foundational blocker check
 *   2. eq.inverse_operations   — direct prerequisite
 *   3. math.linear_equations   — grade-level core
 *   4. eq.multi_step           — procedure control
 *   5. eq.word_translation     — advanced application
 *
 * Evidence from each attempt feeds /api/tutor/respond which runs the BKT
 * update server-side. After Q5, /api/learners/{id}/progress is fetched and
 * used to derive the band placement shown on the result screen.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { MasteryBadge } from "../components/MasteryBadge";
import {
  fetchQuestions,
  postTutorRespond,
  type QuestionSummary,
  type TutorResponse,
} from "../api/tutorAnalytics";
import { CONCEPT_NAMES } from "./TutorPage";

// ---------------------------------------------------------------------------
// Diagnostic concept sequence — one concept per step (§6 adaptive sequencing)
// ---------------------------------------------------------------------------
const DIAGNOSTIC_CONCEPTS = [
  "num.signed_operations",
  "eq.inverse_operations",
  "math.linear_equations",
  "eq.multi_step",
  "eq.word_translation",
] as const;

const CONCEPT_GOALS: Record<string, string> = {
  "num.signed_operations": "Identify foundational blocker",
  "eq.inverse_operations": "Verify direct prerequisite",
  "math.linear_equations": "Grade-level core capability",
  "eq.multi_step": "Procedure and transfer control",
  "eq.word_translation": "Advanced application intent",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Phase =
  | "loading"
  | "answering"
  | "submitting"
  | "feedback"
  | "complete";

interface StepResult {
  conceptId: string;
  questionId: string;
  isCorrect: boolean;
  pKnow: number;
  band: string;
  learnerMessage: string;
  feedbackMessage: string;
  errorTag?: string;
}

interface BandPlacement {
  band: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  nextConcept: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readLearnerId(): string {
  try {
    const stored = localStorage.getItem("prism_user");
    if (stored) return (JSON.parse(stored) as { email: string }).email ?? "";
  } catch { /* ignore */ }
  return "";
}

function readLearnerName(): string {
  try {
    const stored = localStorage.getItem("prism_user");
    if (stored) {
      const u = JSON.parse(stored) as { username?: string; email?: string };
      return u.username ?? u.email?.split("@")[0] ?? "Learner";
    }
  } catch { /* ignore */ }
  return "Learner";
}

function deriveBand(results: StepResult[]): BandPlacement {
  if (results.length === 0) {
    return {
      band: "insufficient_evidence",
      label: "Insufficient Evidence",
      color: "#636e72",
      bg: "rgba(99,110,114,.07)",
      border: "rgba(99,110,114,.18)",
      description: "Complete the diagnostic to receive a placement.",
      nextConcept: "num.signed_operations",
    };
  }
  const avgP = results.reduce((s, r) => s + r.pKnow, 0) / results.length;
  const foundationalMissed =
    !results.find((r) => r.conceptId === "num.signed_operations")?.isCorrect ||
    !results.find((r) => r.conceptId === "eq.inverse_operations")?.isCorrect;
  const advancedCorrect =
    results.find((r) => r.conceptId === "eq.multi_step")?.isCorrect &&
    results.find((r) => r.conceptId === "eq.word_translation")?.isCorrect;

  // Find the first concept where learner needs support
  const weakest = results
    .filter((r) => !r.isCorrect)
    .sort((a, b) => a.pKnow - b.pKnow)[0];
  const nextConcept = weakest?.conceptId ?? "eq.multi_step";

  if (foundationalMissed || avgP < 0.40) {
    return {
      band: "needs_prerequisite_support",
      label: "Foundational",
      color: "#d63031",
      bg: "rgba(214,48,49,.07)",
      border: "rgba(214,48,49,.2)",
      description:
        "Some prerequisite concepts need rebuilding before the current topic. PRISM will start there.",
      nextConcept,
    };
  }
  if (advancedCorrect && avgP >= 0.72) {
    return {
      band: "ready_for_extension",
      label: "Advanced",
      color: "#1bb576",
      bg: "rgba(27,181,118,.07)",
      border: "rgba(27,181,118,.2)",
      description:
        "Strong foundational and procedural evidence. You're ready for extension challenges.",
      nextConcept: "eq.word_translation",
    };
  }
  return {
    band: "developing",
    label: "Grade-Level",
    color: "#e67e22",
    bg: "rgba(230,126,34,.07)",
    border: "rgba(230,126,34,.2)",
    description:
      "Solid on some concepts, with targeted gaps. PRISM will practise those gaps next.",
    nextConcept,
  };
}

function pickQuestion(
  allQuestions: QuestionSummary[],
  conceptId: string,
  usedIds: Set<string>,
): QuestionSummary | null {
  const pool = allQuestions
    .filter((q) => q.concept_id === conceptId && !usedIds.has(q.id))
    .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
  return pool[0] ?? null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StepRail({
  total,
  current,
  results,
}: {
  total: number;
  current: number;
  results: StepResult[];
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ".4rem",
        marginBottom: "2rem",
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-label={`Diagnostic step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        const result = results[i];
        const color = done
          ? result?.isCorrect
            ? "#1bb576"
            : "#d63031"
          : active
            ? "#553285"
            : "#dfe6e9";
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
            <div
              style={{
                width: active ? "2rem" : "1.6rem",
                height: active ? "2rem" : "1.6rem",
                borderRadius: "50%",
                background: done
                  ? color
                  : active
                    ? "transparent"
                    : "#f0f2f5",
                border: `2.5px solid ${color}`,
                display: "grid",
                placeItems: "center",
                fontSize: ".72rem",
                fontWeight: 700,
                color: done ? "#fff" : active ? color : "#b2bec3",
                transition: "all .25s ease",
                boxShadow: active
                  ? `0 0 0 4px rgba(85,50,133,.12)`
                  : undefined,
                flexShrink: 0,
              }}
            >
              {done ? (result?.isCorrect ? "✓" : "✗") : i + 1}
            </div>
            {i < total - 1 && (
              <div
                style={{
                  width: "1rem",
                  height: "2px",
                  borderRadius: "1px",
                  background: done ? color : "#e9ecef",
                  transition: "background .3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MCQOptions({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: ".5rem", marginTop: "1.2rem" }}>
      {options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx); // A, B, C, D
        const isSelected = selected === letter;
        return (
          <button
            key={letter}
            id={`mcq-option-${letter}`}
            disabled={disabled}
            onClick={() => onSelect(letter)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".8rem",
              padding: ".75rem 1rem",
              background: isSelected
                ? "rgba(85,50,133,.07)"
                : "#fff",
              border: `2px solid ${isSelected ? "#553285" : "#dfe6e9"}`,
              borderRadius: ".75rem",
              cursor: disabled ? "default" : "pointer",
              textAlign: "left",
              fontFamily: '"Inter", "Segoe UI", sans-serif',
              fontSize: ".92rem",
              color: "#2d3436",
              transition: "all .15s ease",
              fontWeight: isSelected ? 600 : 400,
            }}
            aria-pressed={isSelected}
          >
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: "1.8rem",
                height: "1.8rem",
                borderRadius: ".4rem",
                background: isSelected ? "#553285" : "#f0f2f5",
                color: isSelected ? "#fff" : "#636e72",
                fontSize: ".75rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {letter}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function DiagnosticPage() {
  const navigate = useNavigate();
  const learnerId = readLearnerId();
  const learnerName = readLearnerName();

  const [allQuestions, setAllQuestions] = useState<QuestionSummary[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [stepIndex, setStepIndex] = useState(0);
  const [currentQ, setCurrentQ] = useState<QuestionSummary | null>(null);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<StepResult[]>([]);
  const [lastResponse, setLastResponse] = useState<TutorResponse | null>(null);
  const [usedIds] = useState(new Set<string>());
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Load question bank once
  useEffect(() => {
    fetchQuestions()
      .then((d) => {
        setAllQuestions(d.questions);
        setPhase("answering");
      })
      .catch(() => setPhase("answering")); // still try — will show empty state
  }, []);

  // Pick question for current step
  useEffect(() => {
    if (phase !== "answering") return;
    if (stepIndex >= DIAGNOSTIC_CONCEPTS.length) {
      setPhase("complete");
      return;
    }
    const conceptId = DIAGNOSTIC_CONCEPTS[stepIndex];
    const q = pickQuestion(allQuestions, conceptId, usedIds);
    setCurrentQ(q);
    setAnswer("");
    setLastResponse(null);
  }, [phase, stepIndex, allQuestions, usedIds]);

  // Scroll to feedback
  useEffect(() => {
    if (phase === "feedback") {
      setTimeout(
        () => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        80,
      );
    }
  }, [phase]);

  const handleSubmit = useCallback(async () => {
    if (!currentQ || !answer.trim() || phase === "submitting") return;
    setPhase("submitting");
    try {
      const resp = await postTutorRespond({
        learner_id: learnerId || "guest@prism.demo",
        question_id: currentQ.id,
        attempt_number: 0,
        learner_answer: answer,
      });
      usedIds.add(currentQ.id);
      setLastResponse(resp);
      const result: StepResult = {
        conceptId: currentQ.concept_id,
        questionId: currentQ.id,
        isCorrect: resp.is_correct ?? false,
        pKnow: resp.p_know ?? 0.35,
        band: resp.is_correct
          ? resp.p_know !== undefined && resp.p_know >= 0.7
            ? "ready_for_extension"
            : "developing"
          : "needs_prerequisite_support",
        learnerMessage: resp.is_correct
          ? "Ready for the next challenge."
          : "Let's rebuild this idea.",
        feedbackMessage: resp.message,
        errorTag: undefined,
      };
      setResults((prev) => [...prev, result]);
      setPhase("feedback");
    } catch {
      setLastResponse({
        response_mode: "error",
        message: "Could not submit answer — check your connection.",
        concept_ids: [],
        citation_ids: [],
        confidence: "low",
        next_action: "retry",
        safety_flags: [],
        is_fallback: true,
        is_correct: false,
      });
      setPhase("feedback");
    }
  }, [currentQ, answer, phase, learnerId, usedIds]);

  const handleNext = useCallback(() => {
    if (stepIndex + 1 >= DIAGNOSTIC_CONCEPTS.length) {
      setPhase("complete");
    } else {
      setStepIndex((i) => i + 1);
      setPhase("answering");
    }
  }, [stepIndex]);

  const band = deriveBand(results);
  const currentConceptId = DIAGNOSTIC_CONCEPTS[stepIndex] as string;
  const currentConceptName = CONCEPT_NAMES[currentConceptId] ?? currentConceptId;

  // ---------------------------------------------------------------------------
  // Render: complete (result screen)
  // ---------------------------------------------------------------------------
  if (phase === "complete") {
    const correctCount = results.filter((r) => r.isCorrect).length;
    return (
      <PageTransition className="app-shell">
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            padding: "clamp(1rem, 3vw, 2rem) 1rem",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "min(95vw, 580px)",
              background: "#fff",
              borderRadius: "1.25rem",
              padding: "clamp(1.2rem, 3vw, 2rem)",
              boxShadow: "0 8px 40px rgba(16,40,30,.13)",
            }}
          >
            {/* Header */}
            <p
              style={{
                margin: "0 0 .4rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "#6c927e",
              }}
            >
              PRISM · diagnostic complete
            </p>
            <h1
              style={{
                margin: "0 0 1.6rem",
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                fontWeight: 700,
                color: "#142b21",
                letterSpacing: "-.03em",
              }}
            >
              Evidence collected.
            </h1>

            {/* Band card */}
            <div
              style={{
                background: band.bg,
                border: `1.5px solid ${band.border}`,
                borderRadius: ".9rem",
                padding: "1.2rem 1.4rem",
                marginBottom: "1.6rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                  marginBottom: ".5rem",
                }}
              >
                <span
                  style={{
                    width: ".6rem",
                    height: ".6rem",
                    borderRadius: "50%",
                    background: band.color,
                    flexShrink: 0,
                  }}
                />
                <strong
                  style={{
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: "1rem",
                    color: band.color,
                    fontWeight: 700,
                  }}
                >
                  {band.label} path
                </strong>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: '"SFMono-Regular", Consolas, monospace',
                    fontSize: ".78rem",
                    color: "#636e72",
                  }}
                >
                  {correctCount}/{DIAGNOSTIC_CONCEPTS.length} correct
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".9rem",
                  color: "#2d3436",
                  lineHeight: 1.55,
                }}
              >
                {band.description}
              </p>
            </div>

            {/* Concept evidence grid */}
            <h2
              style={{
                margin: "0 0 .8rem",
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: ".82rem",
                fontWeight: 700,
                color: "#636e72",
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              Evidence by concept
            </h2>
            <div
              style={{
                display: "grid",
                gap: ".5rem",
                marginBottom: "2rem",
              }}
            >
              {results.map((r) => {
                const friendlyMsg = r.pKnow >= 0.70
                  ? "Ready for next challenge"
                  : r.pKnow >= 0.40
                    ? "Getting there"
                    : "Needs review";
                const friendlyColor = r.pKnow >= 0.70
                  ? "#1bb576"
                  : r.pKnow >= 0.40
                    ? "#e67e22"
                    : "#d63031";
                return (
                  <div
                    key={r.conceptId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".8rem",
                      padding: ".65rem .9rem",
                      background: r.isCorrect
                        ? "rgba(27,181,118,.05)"
                        : "rgba(214,48,49,.05)",
                      border: `1px solid ${r.isCorrect ? "rgba(27,181,118,.15)" : "rgba(214,48,49,.15)"}`,
                      borderRadius: ".65rem",
                    }}
                  >
                    <div
                      style={{
                        width: "1.8rem",
                        height: "1.8rem",
                        borderRadius: "50%",
                        background: r.isCorrect
                          ? "rgba(27,181,118,.12)"
                          : "rgba(214,48,49,.12)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: ".85rem",
                        flexShrink: 0,
                      }}
                    >
                      {r.isCorrect ? "✓" : "✗"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: '"Inter", "Segoe UI", sans-serif',
                          fontSize: ".85rem",
                          fontWeight: 600,
                          color: "#2d3436",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {CONCEPT_NAMES[r.conceptId] ?? r.conceptId}
                      </div>
                      <div
                        style={{
                          fontFamily: '"Inter", "Segoe UI", sans-serif',
                          fontSize: ".72rem",
                          color: friendlyColor,
                          fontWeight: 600,
                          marginTop: ".15rem",
                        }}
                      >
                        {friendlyMsg}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexShrink: 0 }}>
                      <MasteryBadge
                        pKnow={r.pKnow}
                        band={r.band}
                        message={r.isCorrect ? "✓ Correct" : "✗ Needs practice"}
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
              <button
                id="diagnostic-start-lesson"
                onClick={() => navigate(`/lesson/${band.nextConcept}`)}
                style={{
                  flex: 1,
                  padding: ".85rem 1.4rem",
                  background: "#553285",
                  color: "#fff",
                  border: "none",
                  borderRadius: ".75rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".92rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity .15s",
                  minWidth: "11rem",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = ".85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Start recommended lesson →
              </button>
              <button
                id="diagnostic-view-progress"
                onClick={() => navigate("/progress")}
                style={{
                  padding: ".85rem 1.2rem",
                  background: "transparent",
                  color: "#553285",
                  border: "2px solid rgba(85,50,133,.25)",
                  borderRadius: ".75rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".92rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                View evidence
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: question workspace
  // ---------------------------------------------------------------------------
  const isAnswerable = phase === "answering" || phase === "feedback";
  const canSubmit = answer.trim().length > 0 && phase === "answering";

  return (
    <PageTransition className="app-shell">
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "clamp(1.5rem, 5vw, 3rem) 1rem",
        }}
      >
        <div style={{ width: "min(92vw, 600px)" }}>
          {/* Top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.8rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "#6c927e",
              }}
            >
              PRISM · diagnostic
            </p>
            {learnerId && (
              <span
                style={{
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".78rem",
                  color: "rgba(244,247,239,.55)",
                }}
              >
                👤 {learnerName}
              </span>
            )}
          </div>

          {/* Step rail */}
          <StepRail
            total={DIAGNOSTIC_CONCEPTS.length}
            current={stepIndex}
            results={results}
          />

          {/* Step label */}
          <div style={{ marginBottom: "1.4rem" }}>
            <p
              style={{
                margin: "0 0 .25rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".72rem",
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "#91ddc4",
              }}
            >
              Step {stepIndex + 1} of {DIAGNOSTIC_CONCEPTS.length} ·{" "}
              {CONCEPT_GOALS[currentConceptId]}
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
                fontWeight: 700,
                color: "#f4f7ef",
                letterSpacing: "-.02em",
                lineHeight: 1.3,
              }}
            >
              {currentConceptName}
            </h1>
          </div>

          {/* Question card */}
          <div
            style={{
              background: "#fff",
              borderRadius: "1rem",
              padding: "1.6rem",
              boxShadow: "0 4px 24px rgba(16,40,30,.18)",
              marginBottom: "1rem",
            }}
          >
            {phase === "loading" ? (
              <p
                style={{
                  color: "#636e72",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".9rem",
                }}
              >
                Loading question…
              </p>
            ) : !currentQ ? (
              <p
                style={{
                  color: "#d63031",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".9rem",
                }}
              >
                No question available for this concept yet. Click Continue.
              </p>
            ) : (
              <>
                <p
                  style={{
                    margin: "0 0 1rem",
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#2d3436",
                    lineHeight: 1.55,
                  }}
                >
                  {currentQ.prompt}
                </p>

                {/* MCQ options */}
                {currentQ.options && currentQ.options.length > 0 ? (
                  <MCQOptions
                    options={currentQ.options}
                    selected={answer}
                    onSelect={(v) => { if (phase === "answering") setAnswer(v); }}
                    disabled={phase !== "answering"}
                  />
                ) : (
                  /* Free text / numeric */
                  <div style={{ marginTop: "1rem" }}>
                    <label
                      htmlFor="diagnostic-answer"
                      style={{
                        display: "block",
                        fontFamily: '"Inter", "Segoe UI", sans-serif',
                        fontSize: ".8rem",
                        fontWeight: 600,
                        color: "#636e72",
                        marginBottom: ".4rem",
                      }}
                    >
                      Your answer
                    </label>
                    <input
                      id="diagnostic-answer"
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSubmit();
                      }}
                      disabled={phase !== "answering"}
                      placeholder="Type your answer…"
                      style={{
                        width: "100%",
                        padding: ".7rem .9rem",
                        border: "2px solid #dfe6e9",
                        borderRadius: ".6rem",
                        fontFamily: '"Inter", "Segoe UI", sans-serif',
                        fontSize: ".95rem",
                        color: "#2d3436",
                        outline: "none",
                        transition: "border-color .15s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#553285")}
                      onBlur={(e) => (e.target.style.borderColor = "#dfe6e9")}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Feedback card */}
          {(phase === "feedback" || phase === "submitting") && lastResponse && (
            <div
              ref={feedbackRef}
              style={{
                background: lastResponse.is_correct
                  ? "rgba(27,181,118,.09)"
                  : "rgba(214,48,49,.07)",
                border: `1.5px solid ${lastResponse.is_correct ? "rgba(27,181,118,.25)" : "rgba(214,48,49,.2)"}`,
                borderRadius: "1rem",
                padding: "1.2rem 1.4rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".6rem",
                  marginBottom: ".6rem",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>
                  {lastResponse.is_correct ? "✅" : "💡"}
                </span>
                <strong
                  style={{
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".9rem",
                    color: lastResponse.is_correct ? "#1a5c3f" : "#c0392b",
                  }}
                >
                  {lastResponse.is_correct ? "Correct" : "Not quite"}
                </strong>
                {results[results.length - 1] && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: '"Inter", "Segoe UI", sans-serif',
                      fontSize: ".72rem",
                      color: results[results.length - 1].pKnow >= 0.70
                        ? "#1bb576"
                        : results[results.length - 1].pKnow >= 0.40
                          ? "#e67e22"
                          : "#d63031",
                      fontWeight: 600,
                    }}
                  >
                    {results[results.length - 1].pKnow >= 0.70
                      ? "Ready for next challenge"
                      : results[results.length - 1].pKnow >= 0.40
                        ? "Getting there — one more check"
                        : "Let's rebuild this idea"}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".88rem",
                  color: "#2d3436",
                  lineHeight: 1.6,
                }}
              >
                {lastResponse.message}
              </p>
            </div>
          )}

          {/* Action bar */}
          <div
            style={{
              display: "flex",
              gap: ".75rem",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              position: "sticky",
              bottom: 0,
              background: "linear-gradient(transparent, rgba(255,255,255,.95) 20%)",
              paddingTop: "1rem",
              paddingBottom: ".5rem",
              zIndex: 10,
            }}
          >
            {phase === "answering" && (
              <button
                id="diagnostic-submit"
                onClick={() => void handleSubmit()}
                disabled={!canSubmit}
                style={{
                  padding: ".8rem 1.6rem",
                  background: canSubmit ? "#553285" : "#dfe6e9",
                  color: canSubmit ? "#fff" : "#b2bec3",
                  border: "none",
                  borderRadius: ".75rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".92rem",
                  fontWeight: 700,
                  cursor: canSubmit ? "pointer" : "default",
                  transition: "all .15s ease",
                }}
              >
                Submit answer
              </button>
            )}
            {phase === "feedback" && (
              <button
                id="diagnostic-next"
                onClick={handleNext}
                style={{
                  padding: ".8rem 1.6rem",
                  background: "#553285",
                  color: "#fff",
                  border: "none",
                  borderRadius: ".75rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".92rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity .15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = ".85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {stepIndex + 1 >= DIAGNOSTIC_CONCEPTS.length
                  ? "See my results →"
                  : "Next question →"}
              </button>
            )}
            {phase === "submitting" && (
              <span
                style={{
                  padding: ".8rem 1.4rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".9rem",
                  color: "#636e72",
                }}
              >
                Scoring…
              </span>
            )}
            {!currentQ && phase === "answering" && (
              <button
                id="diagnostic-skip"
                onClick={handleNext}
                style={{
                  padding: ".8rem 1.4rem",
                  background: "transparent",
                  color: "rgba(244,247,239,.6)",
                  border: "2px solid rgba(244,247,239,.2)",
                  borderRadius: ".75rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
