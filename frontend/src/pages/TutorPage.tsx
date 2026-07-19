/**
 * TutorPage — Magoosh-inspired structured Socratic tutor interface.
 *
 * Features:
 *   - AI Tutor featured promo card (Magoosh style)
 *   - Question selector as lesson list
 *   - Chat widget with quick-select options
 *   - Hint escalation buttons
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PageTransition } from "../components/PageTransition";
import {
  fetchQuestions,
  postTutorRespond,
  type QuestionSummary,
  type TutorResponse,
} from "../api/tutorAnalytics";

export const CONCEPT_NAMES: Record<string, string> = {
  "num.signed_operations": "Integer Operations (Signed Numbers)",
  "eq.inverse_operations": "Basic Equations (Inverse Operations)",
  "eq.multi_step": "Multi-Step Equations",
  "eq.word_translation": "Word Problems (Equation Translation)",
  "num.mul_div_fluency": "Multiplication & Division Fluency",
};

const MODE_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  socratic_hint: { label: "Socratic hint", color: "#1bb576", icon: "💭" },
  explain_error: { label: "Error explanation", color: "#e67e22", icon: "🔍" },
  worked_step: { label: "Worked step", color: "#553285", icon: "📐" },
  direct_explanation: { label: "Direct explanation", color: "#d63031", icon: "📖" },
  check_thinking: { label: "Transfer check", color: "#553285", icon: "🧠" },
};

const HINT_STYLES: { label: string; color: string; border: string; bg: string }[] = [
  { label: "💭 Socratic Hint", color: "#1bb576", border: "#1bb576", bg: "rgba(27,181,118,.06)" },
  { label: "🔍 Error Explanation", color: "#e67e22", border: "#e67e22", bg: "rgba(230,126,34,.06)" },
  { label: "📐 Worked Step", color: "#553285", border: "#553285", bg: "rgba(85,50,133,.06)" },
  { label: "📖 Direct Explanation", color: "#d63031", border: "#d63031", bg: "rgba(214,48,49,.06)" },
];

const QUICK_OPTIONS = [
  "Am I on track?",
  "What should I study today?",
  "What concept should I learn next?",
  "Recommend practice questions based on my performance.",
];

interface ChatMessage {
  role: "tutor" | "learner";
  content: string;
  mode?: string;
  isFallback?: boolean;
  confidence?: string;
}

export function TutorPage() {
  const [learnerId, setLearnerId] = useState(() => new URLSearchParams(window.location.search).get("learner") ?? "");
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [selectedQ, setSelectedQ] = useState<QuestionSummary | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [solved, setSolved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuestions()
      .then((data) => {
        setQuestions(data.questions);
        setQuestionsLoading(false);
      })
      .catch(() => setQuestionsLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSelectQuestion = useCallback((q: QuestionSummary) => {
    setSelectedQ(q);
    setAttempt(0);
    setChatHistory([
      {
        role: "tutor",
        content: `Hi there! How can I help you with "${q.prompt}"?`,
        mode: "socratic_hint",
      },
    ]);
    setAnswer("");
    setSolved(false);
  }, []);

  const handleAction = useCallback(
    async (forcedAnswer?: string, hintAttempt?: number) => {
      if (!selectedQ || loading || !learnerId) return;
      setLoading(true);

      const isHint = hintAttempt !== undefined;
      const submissionAnswer = isHint
        ? ""
        : forcedAnswer !== undefined
          ? forcedAnswer
          : answer;

      if (!isHint && !submissionAnswer.trim()) {
        setLoading(false);
        return;
      }

      const hintLabels = ["Socratic Hint", "Error Explanation", "Worked Step", "Direct Explanation"];
      const learnerMsg = isHint
        ? `Asked for ${hintLabels[hintAttempt] || "Hint"}`
        : submissionAnswer;

      setChatHistory((prev) => [...prev, { role: "learner", content: learnerMsg }]);

      try {
        const resp: TutorResponse = await postTutorRespond({
          learner_id: learnerId,
          question_id: selectedQ.id,
          attempt_number: isHint ? hintAttempt : attempt,
          learner_answer: submissionAnswer || undefined,
        });

        setChatHistory((prev) => [
          ...prev,
          {
            role: "tutor",
            content: resp.message,
            mode: resp.response_mode,
            isFallback: resp.is_fallback,
            confidence: resp.confidence,
          },
        ]);

        if (resp.is_correct) {
          setSolved(true);
          setChatHistory((prev) => [
            ...prev,
            {
              role: "tutor",
              content: "🎉 Correct! You've mastered this question. Great job!",
              mode: "check_thinking",
            },
          ]);
        } else {
          if (!isHint) {
            setAttempt((a) => Math.min(a + 1, 3));
          } else {
            setAttempt(Math.min(hintAttempt + 1, 3));
          }
        }
        setAnswer("");
      } catch {
        setChatHistory((prev) => [
          ...prev,
          { role: "tutor", content: "Something went wrong. Please try again.", mode: "error" },
        ]);
      }
      setLoading(false);
    },
    [selectedQ, attempt, answer, loading],
  );

  return (
    <PageTransition className="dashboard-page mg-page">
      {/* Breadcrumb */}
      <div className="mg-breadcrumb">
        <a href="/learn">Home</a>
        <span>›</span>
        <span>PRISM AI Tutor</span>
      </div>

      <label className="mg-learner-input">
        Learner ID
        <input value={learnerId} onChange={(event) => setLearnerId(event.target.value)} placeholder="Enter your learner ID" />
      </label>

      {/* AI Tutor featured card (Magoosh-style) */}
      {!selectedQ && (
        <div className="mg-featured-card" style={{ marginBottom: "2rem" }}>
          <div className="mg-featured-icon">🎓</div>
          <div className="mg-featured-body">
            <span className="mg-pill mg-pill--purple" style={{ marginBottom: ".5rem" }}>
              PRISM AI Tutor
            </span>
            <h2 style={{
              margin: ".5rem 0 .4rem",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#2d3436",
              fontFamily: '"Inter", sans-serif',
            }}>
              Get Personalized Guidance And Never Get Stuck
            </h2>
            <p style={{
              margin: 0, color: "#636e72", fontSize: ".9rem",
              lineHeight: 1.6, fontFamily: '"Inter", sans-serif',
            }}>
              "Am I on track?"<br />
              "What lessons should I study next?"<br />
              "Recommend practice questions based on my performance."
            </p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginTop: ".8rem" }}>
              <span style={{
                color: "#553285", fontWeight: 700, fontSize: ".9rem",
                fontFamily: '"Inter", sans-serif', cursor: "pointer",
                textDecoration: "underline",
              }}>
                Select a question below to launch ↓
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Question selector / Chat interface */}
      {!selectedQ ? (
        <section aria-label="Select a question">
          <h2 className="mg-section-title">
            Choose a question to work on
          </h2>
          {questionsLoading ? (
            <p style={{ color: "#636e72" }}>Loading questions…</p>
          ) : (
            <div className="mg-lesson-list">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="mg-lesson-item"
                  onClick={() => handleSelectQuestion(q)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectQuestion(q);
                    }
                  }}
                >
                  <div className="mg-lesson-check">✓</div>
                  <div>
                    <div className="mg-lesson-badge">
                      {CONCEPT_NAMES[q.concept_id] || q.concept_id} · difficulty{" "}
                      {(q.difficulty * 100).toFixed(0)}%
                    </div>
                    <div className="mg-lesson-title">{q.prompt}</div>
                  </div>
                  <span className="mg-lesson-meta">Q{idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Active question — two column layout with chat widget */
        <div className="mg-chat-container">
          {/* Left: question details + hints */}
          <div>
            <button
              className="mg-btn"
              onClick={() => {
                setSelectedQ(null);
                setAttempt(0);
                setChatHistory([]);
                setSolved(false);
              }}
              style={{ marginBottom: "1rem" }}
            >
              ← Back to questions
            </button>

            {/* Question card */}
            <div className="mg-card" style={{ marginBottom: "1rem" }}>
              <span className="mg-pill mg-pill--purple" style={{ marginBottom: ".4rem" }}>
                {CONCEPT_NAMES[selectedQ.concept_id] || selectedQ.concept_id}
              </span>
              <h2 style={{
                margin: ".5rem 0 .6rem",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "#2d3436",
                fontFamily: '"Inter", sans-serif',
              }}>
                {selectedQ.prompt}
              </h2>

              {/* Escalation ladder */}
              <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
                {Object.entries(MODE_DISPLAY).map(([mode, info]) => {
                  const isActive = chatHistory.some((m) => m.mode === mode);
                  return (
                    <span
                      key={mode}
                      className={`mg-pill ${isActive ? "" : ""}`}
                      style={{
                        borderColor: isActive ? info.color : "#e8e8e8",
                        color: isActive ? info.color : "#b2bec3",
                        background: isActive ? `${info.color}10` : "transparent",
                        fontSize: ".68rem",
                      }}
                    >
                      {info.icon} {info.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Hint buttons */}
            {!solved && (
              <div className="mg-hint-row">
                {HINT_STYLES.map((hint, idx) => (
                  <button
                    key={idx}
                    className="mg-hint-btn"
                    onClick={() => handleAction(undefined, idx)}
                    disabled={loading || attempt < idx}
                    style={{
                      borderColor: hint.border,
                      color: hint.color,
                      background: attempt === idx ? hint.bg : "#fff",
                    }}
                  >
                    {hint.label}
                  </button>
                ))}
              </div>
            )}

            {solved && (
              <div className="mg-card" style={{
                textAlign: "center",
                background: "rgba(27, 181, 118, 0.06)",
                border: "1px solid rgba(27, 181, 118, 0.2)",
              }}>
                <p style={{ margin: 0, color: "#158f5e", fontSize: ".95rem", fontWeight: 700, fontFamily: '"Inter", sans-serif' }}>
                  ✅ Question resolved!
                </p>
                <button
                  className="mg-btn mg-btn--primary"
                  style={{ marginTop: ".8rem" }}
                  onClick={() => {
                    setSelectedQ(null);
                    setAttempt(0);
                    setChatHistory([]);
                    setSolved(false);
                  }}
                >
                  Select another question
                </button>
              </div>
            )}
          </div>

          {/* Right: Chat widget */}
          <div className="mg-chat-widget">
            <div className="mg-chat-header">
              <span style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "linear-gradient(135deg, #1bb576, #553285)",
                display: "inline-grid", placeItems: "center",
                color: "#fff", fontSize: ".65rem",
              }}>🎓</span>
              <span className="mg-pill mg-pill--green" style={{ fontSize: ".65rem", padding: ".15rem .5rem" }}>
                PRISM Tutor
              </span>
              <span style={{ marginLeft: "auto", fontSize: ".75rem", color: "#636e72" }}>
                Viewing: {CONCEPT_NAMES[selectedQ.concept_id]?.split(" ")[0] || "Question"}
              </span>
            </div>

            <div className="mg-chat-body">
              {chatHistory.length === 0 && (
                <>
                  <div style={{ textAlign: "center", padding: "1rem 0" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: "linear-gradient(135deg, #1bb576, #553285)",
                      display: "inline-grid", placeItems: "center",
                      color: "#fff", fontSize: "1rem", marginBottom: ".5rem",
                    }}>🎓</div>
                    <p style={{ color: "#1bb576", fontSize: ".75rem", fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
                      ✓ in a few seconds
                    </p>
                  </div>
                  <p style={{ textAlign: "center", fontWeight: 700, color: "#2d3436", fontFamily: '"Inter", sans-serif' }}>
                    Hi there! How can I help?
                  </p>
                  <p style={{ textAlign: "center", color: "#1bb576", fontSize: ".82rem", fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
                    Select an option or ask away below
                  </p>
                  <div className="mg-quick-options">
                    {QUICK_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        className="mg-quick-option"
                        onClick={() => handleAction(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {chatHistory.map((msg, idx) => {
                const modeInfo = msg.mode ? MODE_DISPLAY[msg.mode] : null;
                return (
                  <div key={idx}>
                    {msg.role === "tutor" && modeInfo && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: ".3rem",
                        marginBottom: ".2rem",
                      }}>
                        <span style={{
                          fontSize: ".65rem", fontWeight: 600,
                          color: modeInfo.color,
                          fontFamily: '"Inter", sans-serif',
                        }}>
                          {modeInfo.icon} {modeInfo.label}
                        </span>
                        {msg.isFallback && (
                          <span style={{
                            fontSize: ".6rem", color: "#b2bec3",
                            background: "rgba(0,0,0,0.04)",
                            padding: ".1rem .3rem", borderRadius: ".2rem",
                          }}>
                            fallback
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`mg-chat-bubble ${msg.role === "tutor" ? "mg-chat-bubble--tutor" : "mg-chat-bubble--learner"}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            {!solved && (
              <div className="mg-chat-input-row">
                <input
                  type="text"
                  className="mg-chat-input"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAction();
                    }
                  }}
                  placeholder="Ask away..."
                  disabled={loading}
                  id="tutor-answer-input"
                />
                <button
                  className="mg-chat-send"
                  onClick={() => handleAction()}
                  disabled={loading}
                  id="tutor-submit-btn"
                >
                  ➤
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
