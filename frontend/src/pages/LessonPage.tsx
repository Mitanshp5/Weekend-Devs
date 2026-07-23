/**
 * LessonPage — Focused micro-lesson + practice stage.
 *
 * Route: /lesson/:lessonId  (lessonId = concept_id, e.g. "eq.inverse_operations")
 *
 * Flow:
 *   - Header: concept name, prerequisite path, BKT mastery ring
 *   - Practice stage: 3 questions in difficulty order for the concept
 *   - Per attempt: answer → /api/tutor/respond → inline Socratic feedback
 *   - After 3 questions (or mastery ≥ 0.70): completion card with updated
 *     BKT, learner message, and a "Start next lesson" CTA
 *   - Throughout: RecommendationPanel slides in after each scored attempt
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { DonutChart } from "../components/DonutChart";
import { RecommendationPanel } from "../components/RecommendationPanel";
import {
  fetchQuestions,
  postTutorRespond,
  postGuidance,
  type QuestionSummary,
  type TutorResponse,
  type GuidanceResponse,
} from "../api/tutorAnalytics";
import { CONCEPT_NAMES } from "./TutorPage";

// ---------------------------------------------------------------------------
// Prerequisite chain display (cosmetic — shows learner where they are)
// ---------------------------------------------------------------------------
const PREREQ_CHAIN: Record<string, string[]> = {
  "num.signed_operations": [],
  "num.mul_div_fluency": [],
  "eq.inverse_operations": ["num.signed_operations", "num.mul_div_fluency"],
  "math.linear_equations": ["eq.inverse_operations"],
  "eq.multi_step": ["math.linear_equations"],
  "eq.word_translation": ["eq.multi_step"],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type LessonPhase = "loading" | "practising" | "submitting" | "feedback" | "complete";

interface AttemptRecord {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  pKnow: number;
  feedback: string;
  mode: string;
  hintLevel: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readLearnerId(): string {
  try {
    const s = localStorage.getItem("prism_user");
    if (s) return (JSON.parse(s) as { email: string }).email ?? "";
  } catch { /* ignore */ }
  return "";
}

function readLearnerName(): string {
  try {
    const s = localStorage.getItem("prism_user");
    if (s) {
      const u = JSON.parse(s) as { username?: string; email?: string };
      return u.username ?? u.email?.split("@")[0] ?? "Learner";
    }
  } catch { /* ignore */ }
  return "Learner";
}

function pickLessonQuestions(
  all: QuestionSummary[],
  conceptId: string,
): QuestionSummary[] {
  return all
    .filter((q) => q.concept_id === conceptId)
    .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0))
    .slice(0, 3);
}

const MODE_META: Record<string, { label: string; color: string; icon: string }> = {
  socratic_hint:       { label: "Think About It",  color: "#1bb576", icon: "💭" },
  explain_error:       { label: "What Went Wrong", color: "#e67e22", icon: "🔍" },
  worked_step:         { label: "Show Me a Step",  color: "#553285", icon: "📐" },
  direct_explanation:  { label: "Full Solution",   color: "#d63031", icon: "📖" },
  check_thinking:      { label: "Correct!",        color: "#1bb576", icon: "✅" },
  error:               { label: "Error",           color: "#d63031", icon: "⚠️" },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function QuestionDots({
  total,
  current,
  attempts,
}: {
  total: number;
  current: number;
  attempts: AttemptRecord[];
}) {
  return (
    <div
      style={{ display: "flex", gap: ".5rem", alignItems: "center" }}
      aria-label={`Question ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        const attempt = attempts[i];
        return (
          <div
            key={i}
            style={{
              width: active ? ".85rem" : ".55rem",
              height: ".55rem",
              borderRadius: ".3rem",
              background: done
                ? attempt?.isCorrect
                  ? "#1bb576"
                  : "#d63031"
                : active
                  ? "#553285"
                  : "rgba(255,255,255,.18)",
              transition: "all .2s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function HintButtons({
  hintLevel,
  onHint,
  disabled,
}: {
  hintLevel: number;
  onHint: (level: number) => void;
  disabled: boolean;
}) {
  const hints = [
    { level: 0, label: "💭 Think About It" },
    { level: 1, label: "🔍 What Went Wrong" },
    { level: 2, label: "📐 Show Me a Step" },
    { level: 3, label: "📖 Full Solution" },
  ];
  return (
    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
      {hints.map((h) => (
        <button
          key={h.level}
          id={`lesson-hint-${h.level}`}
          disabled={disabled || h.level < hintLevel}
          onClick={() => onHint(h.level)}
          style={{
            padding: ".35rem .7rem",
            background:
              h.level < hintLevel
                ? "rgba(85,50,133,.06)"
                : "transparent",
            border: `1.5px solid ${h.level < hintLevel ? "rgba(85,50,133,.15)" : "rgba(85,50,133,.3)"}`,
            borderRadius: ".55rem",
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            fontSize: ".78rem",
            fontWeight: 600,
            color: h.level < hintLevel ? "#b2bec3" : "#553285",
            cursor: disabled || h.level < hintLevel ? "default" : "pointer",
            opacity: disabled ? 0.5 : 1,
            transition: "all .15s ease",
          }}
        >
          {h.label}
        </button>
      ))}
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
    <div style={{ display: "grid", gap: ".45rem", marginTop: "1rem" }}>
      {options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isSelected = selected === letter;
        return (
          <button
            key={letter}
            id={`lesson-mcq-${letter}`}
            disabled={disabled}
            onClick={() => onSelect(letter)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
              padding: ".7rem .95rem",
              background: isSelected ? "rgba(85,50,133,.06)" : "#fafbfc",
              border: `2px solid ${isSelected ? "#553285" : "#e9ecef"}`,
              borderRadius: ".7rem",
              cursor: disabled ? "default" : "pointer",
              textAlign: "left",
              fontFamily: '"Inter", "Segoe UI", sans-serif',
              fontSize: ".9rem",
              color: "#2d3436",
              transition: "all .15s ease",
              fontWeight: isSelected ? 600 : 400,
            }}
            aria-pressed={isSelected}
          >
            <span
              style={{
                width: "1.6rem",
                height: "1.6rem",
                borderRadius: ".35rem",
                background: isSelected ? "#553285" : "#edf0f2",
                color: isSelected ? "#fff" : "#74818d",
                display: "grid",
                placeItems: "center",
                fontSize: ".72rem",
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
export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const learnerId = readLearnerId();
  const learnerName = readLearnerName();

  const conceptId = lessonId ?? "eq.inverse_operations";
  const conceptName = CONCEPT_NAMES[conceptId] ?? conceptId;
  const prereqs = PREREQ_CHAIN[conceptId] ?? [];

  const [allQuestions, setAllQuestions] = useState<QuestionSummary[]>([]);
  const [lessonQuestions, setLessonQuestions] = useState<QuestionSummary[]>([]);
  const [phase, setPhase] = useState<LessonPhase>("loading");
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [lastResponse, setLastResponse] = useState<TutorResponse | null>(null);
  const [currentPKnow, setCurrentPKnow] = useState(0.35);
  const [panelOpen, setPanelOpen] = useState(false);
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Load questions
  useEffect(() => {
    fetchQuestions()
      .then((d) => {
        setAllQuestions(d.questions);
        const qs = pickLessonQuestions(d.questions, conceptId);
        setLessonQuestions(qs);
        setPhase(qs.length > 0 ? "practising" : "complete");
      })
      .catch(() => setPhase("practising"));
  }, [conceptId]);

  // Scroll to feedback
  useEffect(() => {
    if (phase === "feedback") {
      setTimeout(
        () => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
        80,
      );
    }
  }, [phase]);

  const currentQ = lessonQuestions[qIndex] ?? null;

  const handleSubmit = useCallback(async () => {
    if (!currentQ || !answer.trim() || phase === "submitting") return;
    setPhase("submitting");
    try {
      const resp = await postTutorRespond({
        learner_id: learnerId || "guest@prism.demo",
        question_id: currentQ.id,
        attempt_number: hintLevel,
        learner_answer: answer,
      });
      setLastResponse(resp);
      const pKnow = resp.p_know ?? currentPKnow;
      setCurrentPKnow(pKnow);
      setAttempts((prev) => [
        ...prev,
        {
          questionId: currentQ.id,
          answer,
          isCorrect: resp.is_correct ?? false,
          pKnow,
          feedback: resp.message,
          mode: resp.response_mode,
          hintLevel,
        },
      ]);
      setPhase("feedback");
      // Fetch guidance for panel
      postGuidance({
        learner_id: learnerId || "guest@prism.demo",
        question_type: "what_to_study_next",
      })
        .then((g) => setGuidance(g))
        .catch(() => {});
    } catch {
      setLastResponse({
        response_mode: "error",
        message: "Could not submit — check your connection.",
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
  }, [currentQ, answer, phase, hintLevel, learnerId, currentPKnow]);

  const handleHint = useCallback(
    async (level: number) => {
      if (!currentQ || phase === "submitting") return;
      setPhase("submitting");
      try {
        const resp = await postTutorRespond({
          learner_id: learnerId || "guest@prism.demo",
          question_id: currentQ.id,
          attempt_number: level,
          learner_answer: "",
        });
        setLastResponse(resp);
        setHintLevel(level + 1);
        setPhase("feedback");
      } catch {
        setPhase("practising");
      }
    },
    [currentQ, phase, learnerId],
  );

  const handleNext = useCallback(() => {
    const nextIdx = qIndex + 1;
    const doneAll = nextIdx >= lessonQuestions.length;
    const mastered = currentPKnow >= 0.70;
    if (doneAll || mastered) {
      setPhase("complete");
    } else {
      setQIndex(nextIdx);
      setAnswer("");
      setHintLevel(0);
      setLastResponse(null);
      setPhase("practising");
    }
  }, [qIndex, lessonQuestions.length, currentPKnow]);

  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const masteryPct = Math.round(currentPKnow * 100);

  // ---------------------------------------------------------------------------
  // Completion screen
  // ---------------------------------------------------------------------------
  if (phase === "complete") {
    const mastered = currentPKnow >= 0.70;
    return (
      <PageTransition className="app-shell">
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1rem",
          }}
        >
          <div
            style={{
              width: "min(90vw, 580px)",
              background: "#fff",
              borderRadius: "1.25rem",
              padding: "2.5rem",
              boxShadow: "0 8px 40px rgba(16,40,30,.14)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "5rem",
                height: "5rem",
                margin: "0 auto 1.4rem",
                borderRadius: "50%",
                background: mastered
                  ? "rgba(27,181,118,.1)"
                  : "rgba(230,126,34,.08)",
                display: "grid",
                placeItems: "center",
                fontSize: "2rem",
              }}
            >
              {mastered ? "🎯" : "📈"}
            </div>
            <p
              style={{
                margin: "0 0 .3rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "#6c927e",
              }}
            >
              PRISM · lesson complete
            </p>
            <h1
              style={{
                margin: "0 0 .5rem",
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: "clamp(1.4rem, 4vw, 2rem)",
                fontWeight: 700,
                color: "#142b21",
                letterSpacing: "-.03em",
              }}
            >
              {mastered
                ? "Ready for the next challenge."
                : "You're getting there — one more check."}
            </h1>
            <p
              style={{
                margin: "0 0 1.8rem",
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: ".92rem",
                color: "#636e72",
                lineHeight: 1.6,
              }}
            >
              {conceptName} · {correctCount} of {attempts.length} correct
            </p>

            {/* Mastery ring */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.8rem" }}>
              <DonutChart
                value={masteryPct}
                size={120}
                strokeWidth={10}
                color={mastered ? "#1bb576" : "#e67e22"}
                label={`${masteryPct}%`}
                labelSize={20}
              />
            </div>

            {/* Evidence note */}
            <p
              style={{
                margin: "0 0 1.8rem",
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".72rem",
                color: "#636e72",
                fontFeatureSettings: '"tnum"',
              }}
            >
              P(know) = {currentPKnow.toFixed(3)} ·{" "}
              {mastered ? "mastery threshold reached" : "continue practising"}
            </p>

            <div style={{ display: "flex", gap: ".7rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                id="lesson-complete-tutor"
                onClick={() => navigate("/tutor")}
                style={{
                  padding: ".8rem 1.4rem",
                  background: "#553285",
                  color: "#fff",
                  border: "none",
                  borderRadius: ".75rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity .15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = ".85")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Continue with Tutor →
              </button>
              <button
                id="lesson-complete-progress"
                onClick={() => navigate("/progress")}
                style={{
                  padding: ".8rem 1.2rem",
                  background: "transparent",
                  color: "#553285",
                  border: "2px solid rgba(85,50,133,.25)",
                  borderRadius: ".75rem",
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".9rem",
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
  // Practice workspace
  // ---------------------------------------------------------------------------
  const canSubmit = answer.trim().length > 0 && phase === "practising";

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
              marginBottom: "1.4rem",
            }}
          >
            <button
              id="lesson-back"
              onClick={() => navigate(-1)}
              style={{
                background: "transparent",
                border: "none",
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: ".82rem",
                color: "rgba(244,247,239,.55)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Back
            </button>
            <span
              style={{
                fontFamily: '"SFMono-Regular", Consolas, monospace',
                fontSize: ".68rem",
                fontWeight: 700,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: "#6c927e",
              }}
            >
              PRISM · lesson
            </span>
            {learnerId && (
              <span
                style={{
                  fontFamily: '"Inter", "Segoe UI", sans-serif',
                  fontSize: ".78rem",
                  color: "rgba(244,247,239,.45)",
                }}
              >
                {learnerName}
              </span>
            )}
          </div>

          {/* Concept header */}
          <div style={{ marginBottom: "1.6rem" }}>
            {/* Prerequisite breadcrumb */}
            {prereqs.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".3rem",
                  marginBottom: ".5rem",
                  flexWrap: "wrap",
                }}
              >
                {prereqs.map((p, i) => (
                  <span key={p} style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
                    {i > 0 && (
                      <span style={{ color: "rgba(244,247,239,.3)", fontSize: ".75rem" }}>
                        →
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: '"Inter", "Segoe UI", sans-serif',
                        fontSize: ".72rem",
                        color: "rgba(244,247,239,.4)",
                      }}
                    >
                      {CONCEPT_NAMES[p] ?? p}
                    </span>
                  </span>
                ))}
                <span style={{ color: "rgba(244,247,239,.3)", fontSize: ".75rem" }}>→</span>
                <span
                  style={{
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".72rem",
                    color: "#91ddc4",
                    fontWeight: 600,
                  }}
                >
                  {conceptName}
                </span>
              </div>
            )}

            {/* Concept + mastery ring */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
                    fontWeight: 700,
                    color: "#f4f7ef",
                    letterSpacing: "-.02em",
                    lineHeight: 1.25,
                  }}
                >
                  {conceptName}
                </h1>
                <div style={{ marginTop: ".6rem" }}>
                  <QuestionDots
                    total={lessonQuestions.length || 3}
                    current={qIndex}
                    attempts={attempts}
                  />
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <DonutChart
                  value={masteryPct}
                  size={60}
                  strokeWidth={6}
                  color={
                    currentPKnow >= 0.70
                      ? "#1bb576"
                      : currentPKnow >= 0.40
                        ? "#e67e22"
                        : "#d63031"
                  }
                  label={`${masteryPct}%`}
                  labelSize={11}
                />
              </div>
            </div>
          </div>

          {/* Question card */}
          <div
            style={{
              background: "#fff",
              borderRadius: "1rem",
              padding: "1.6rem",
              boxShadow: "0 4px 24px rgba(16,40,30,.16)",
              marginBottom: ".9rem",
            }}
          >
            {phase === "loading" ? (
              <p style={{ color: "#636e72", fontFamily: '"Inter", "Segoe UI", sans-serif' }}>
                Loading question…
              </p>
            ) : !currentQ ? (
              <div>
                <p
                  style={{
                    color: "#636e72",
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".9rem",
                    margin: 0,
                  }}
                >
                  No practice questions available for this concept yet.
                </p>
                <button
                  style={{
                    marginTop: "1rem",
                    padding: ".7rem 1.2rem",
                    background: "#553285",
                    color: "#fff",
                    border: "none",
                    borderRadius: ".65rem",
                    cursor: "pointer",
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontWeight: 700,
                    fontSize: ".88rem",
                  }}
                  onClick={() => navigate("/tutor")}
                >
                  Go to Tutor →
                </button>
              </div>
            ) : (
              <>
                {/* Question label */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: ".9rem",
                    flexWrap: "wrap",
                    gap: ".4rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"SFMono-Regular", Consolas, monospace',
                      fontSize: ".7rem",
                      fontWeight: 700,
                      letterSpacing: ".09em",
                      textTransform: "uppercase",
                      color: "#636e72",
                    }}
                  >
                    Question {qIndex + 1} of {lessonQuestions.length}
                  </span>
                  <span
                    style={{
                      fontFamily: '"Inter", "Segoe UI", sans-serif',
                      fontSize: ".72rem",
                      color:
                        (currentQ.difficulty ?? 0) <= 0.35
                          ? "#1bb576"
                          : (currentQ.difficulty ?? 0) <= 0.55
                            ? "#e67e22"
                            : "#d63031",
                      fontWeight: 600,
                    }}
                  >
                    {(currentQ.difficulty ?? 0) <= 0.35
                      ? "Easy"
                      : (currentQ.difficulty ?? 0) <= 0.55
                        ? "Medium"
                        : "Hard"}
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".98rem",
                    fontWeight: 600,
                    color: "#2d3436",
                    lineHeight: 1.55,
                  }}
                >
                  {currentQ.prompt}
                </p>

                {/* MCQ or text */}
                {currentQ.options && currentQ.options.length > 0 ? (
                  <MCQOptions
                    options={currentQ.options}
                    selected={answer}
                    onSelect={(v) => { if (phase === "practising") setAnswer(v); }}
                    disabled={phase !== "practising"}
                  />
                ) : (
                  <div style={{ marginTop: "1rem" }}>
                    <label
                      htmlFor="lesson-answer"
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
                      id="lesson-answer"
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSubmit();
                      }}
                      disabled={phase !== "practising"}
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
          {phase === "feedback" && lastResponse && (
            <div
              ref={feedbackRef}
              style={{
                background: "#fff",
                borderRadius: "1rem",
                padding: "1.2rem 1.4rem",
                boxShadow: "0 2px 12px rgba(16,40,30,.1)",
                marginBottom: ".9rem",
                borderLeft: `4px solid ${
                  lastResponse.is_correct ? "#1bb576" : "#e67e22"
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".5rem",
                  marginBottom: ".5rem",
                }}
              >
                <span>
                  {MODE_META[lastResponse.response_mode]?.icon ?? "💡"}
                </span>
                <span
                  style={{
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".82rem",
                    fontWeight: 700,
                    color:
                      MODE_META[lastResponse.response_mode]?.color ?? "#553285",
                  }}
                >
                  {MODE_META[lastResponse.response_mode]?.label ?? "Feedback"}
                </span>
                {lastResponse.p_know !== undefined && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: '"SFMono-Regular", Consolas, monospace',
                      fontSize: ".7rem",
                      color: "#636e72",
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    P(know) = {(lastResponse.p_know * 100).toFixed(0)}%
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

          {/* Hint buttons (only while practising or after wrong feedback) */}
          {(phase === "practising" ||
            (phase === "feedback" && !lastResponse?.is_correct)) && currentQ && (
            <div style={{ marginBottom: ".9rem" }}>
              <HintButtons
                hintLevel={hintLevel}
                onHint={handleHint}
                disabled={false}
              />
            </div>
          )}

          {/* Action bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: ".75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              id="lesson-open-panel"
              onClick={() => setPanelOpen(true)}
              style={{
                padding: ".55rem 1rem",
                background: "transparent",
                border: "1.5px solid rgba(145,221,196,.35)",
                borderRadius: ".6rem",
                fontFamily: '"Inter", "Segoe UI", sans-serif',
                fontSize: ".8rem",
                fontWeight: 600,
                color: "#91ddc4",
                cursor: "pointer",
              }}
            >
              📊 Evidence
            </button>

            <div style={{ display: "flex", gap: ".6rem" }}>
              {phase === "practising" && (
                <button
                  id="lesson-submit"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit}
                  style={{
                    padding: ".75rem 1.5rem",
                    background: canSubmit ? "#553285" : "#dfe6e9",
                    color: canSubmit ? "#fff" : "#b2bec3",
                    border: "none",
                    borderRadius: ".7rem",
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".9rem",
                    fontWeight: 700,
                    cursor: canSubmit ? "pointer" : "default",
                    transition: "all .15s",
                  }}
                >
                  Submit
                </button>
              )}
              {phase === "feedback" && (
                <button
                  id="lesson-next"
                  onClick={handleNext}
                  style={{
                    padding: ".75rem 1.5rem",
                    background: "#553285",
                    color: "#fff",
                    border: "none",
                    borderRadius: ".7rem",
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".9rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "opacity .15s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = ".85")}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  {qIndex + 1 >= lessonQuestions.length || currentPKnow >= 0.70
                    ? "Finish lesson →"
                    : "Next question →"}
                </button>
              )}
              {phase === "submitting" && (
                <span
                  style={{
                    padding: ".75rem 1.2rem",
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    fontSize: ".88rem",
                    color: "rgba(244,247,239,.5)",
                  }}
                >
                  Scoring…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation / Evidence panel */}
      <RecommendationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        learnerId={learnerId}
        conceptId={conceptId}
        pKnow={currentPKnow}
        guidance={guidance}
        onReview={() => { setPanelOpen(false); navigate("/progress"); }}
        onRetry={() => {
          setPanelOpen(false);
          setQIndex(0);
          setAttempts([]);
          setAnswer("");
          setHintLevel(0);
          setLastResponse(null);
          setCurrentPKnow(0.35);
          setPhase("practising");
        }}
        onEasier={() => {
          // Filter to easier questions from the same concept
          const easier = allQuestions
            .filter(
              (q) =>
                q.concept_id === conceptId &&
                (q.difficulty ?? 0) < (currentQ?.difficulty ?? 0.5),
            )
            .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
          if (easier.length > 0) {
            setLessonQuestions(easier.slice(0, 3));
            setQIndex(0);
            setAnswer("");
            setHintLevel(0);
            setLastResponse(null);
            setPhase("practising");
          }
          setPanelOpen(false);
        }}
        onHarder={() => {
          const harder = allQuestions
            .filter(
              (q) =>
                q.concept_id === conceptId &&
                (q.difficulty ?? 0) > (currentQ?.difficulty ?? 0.5),
            )
            .sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
          if (harder.length > 0) {
            setLessonQuestions(harder.slice(0, 3));
            setQIndex(0);
            setAnswer("");
            setHintLevel(0);
            setLastResponse(null);
            setPhase("practising");
          }
          setPanelOpen(false);
        }}
      />
    </PageTransition>
  );
}
