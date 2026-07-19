/**
 * TutorPage — structured Socratic tutor interface.
 */

import { useCallback, useEffect, useState } from "react";
import { PageTransition } from "../components/PageTransition";
import {
  fetchQuestions,
  postTutorRespond,
  type QuestionSummary,
  type TutorResponse,
} from "../api/person3";

export const CONCEPT_NAMES: Record<string, string> = {
  "num.signed_operations": "Integer Operations (Signed Numbers)",
  "eq.inverse_operations": "Basic Equations (Inverse Operations)",
  "eq.multi_step": "Multi-Step Equations",
  "eq.word_translation": "Word Problems (Equation Translation)",
  "num.mul_div_fluency": "Multiplication & Division Fluency",
};

const MODE_DISPLAY: Record<string, { label: string; color: string; icon: string }> = {
  socratic_hint: { label: "Socratic hint", color: "#4d8b72", icon: "💭" },
  explain_error: { label: "Error explanation", color: "#c5a600", icon: "🔍" },
  worked_step: { label: "Worked step", color: "#e67e22", icon: "📐" },
  direct_explanation: { label: "Direct explanation", color: "#b44", icon: "📖" },
  check_thinking: { label: "Transfer check", color: "#6a5acd", icon: "🧠" },
};

const DEMO_LEARNER = "student-02";

interface ChatMessage {
  role: "tutor" | "learner";
  content: string;
  mode?: string;
  isFallback?: boolean;
  confidence?: string;
}

export function TutorPage() {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [selectedQ, setSelectedQ] = useState<QuestionSummary | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    fetchQuestions()
      .then((data) => {
        setQuestions(data.questions);
        setQuestionsLoading(false);
      })
      .catch(() => setQuestionsLoading(false));
  }, []);

  const handleSelectQuestion = useCallback((q: QuestionSummary) => {
    setSelectedQ(q);
    setAttempt(0);
    setChatHistory([]);
    setAnswer("");
    setSolved(false);
  }, []);

  const handleAction = useCallback(async (forcedAnswer?: string, hintAttempt?: number) => {
    if (!selectedQ || loading) return;
    setLoading(true);

    const isHint = hintAttempt !== undefined;
    const submissionAnswer = isHint ? "" : (forcedAnswer !== undefined ? forcedAnswer : answer);

    if (!isHint && !submissionAnswer.trim()) {
      setLoading(false);
      return;
    }

    // Add learner message to chat
    const hintLabels = ["Socratic Hint", "Error Explanation", "Worked Step", "Direct Explanation"];
    const learnerMsg = isHint 
      ? `Asked for ${hintLabels[hintAttempt] || "Hint"}` 
      : `Submitted answer: ${submissionAnswer}`;
      
    setChatHistory((prev) => [...prev, { role: "learner", content: learnerMsg }]);

    try {
      const resp: TutorResponse = await postTutorRespond({
        learner_id: DEMO_LEARNER,
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
          { role: "tutor", content: "🎉 Correct answer! You have successfully mastered this question.", mode: "check_thinking" }
        ]);
      } else {
        if (!isHint) {
          // Incorrect answer automatically advances hint level
          setAttempt((a) => Math.min(a + 1, 3));
        } else {
          // Direct hint button updates active hint level
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
  }, [selectedQ, attempt, answer, loading]);

  return (
    <PageTransition className="dashboard-page">
      <p className="eyebrow">Doubt tutor</p>
      <h1>Ask for a&nbsp;hint, not just an&nbsp;answer</h1>
      <p className="page-copy">
        The tutor gives guided, curriculum-grounded responses that escalate from
        a Socratic question to a full explanation — only when you need it.
      </p>

      {/* Question selector */}
      {!selectedQ ? (
        <section style={{ marginTop: "2rem" }} aria-label="Select a question">
          <h2 style={{ fontSize: "1rem", color: "#17392c", margin: "0 0 1rem" }}>
            Choose a question to work on
          </h2>
          {questionsLoading ? (
            <p style={{ color: "#6a8478" }}>Loading questions…</p>
          ) : (
            <div className="placeholder-grid">
              {questions.map((q) => (
                <article
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  style={{ cursor: "pointer" }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectQuestion(q);
                    }
                  }}
                >
                  <span style={{ color: "#4d8b72", font: '500 .7rem "DM Mono", monospace' }}>
                    {CONCEPT_NAMES[q.concept_id] || q.concept_id} · difficulty {(q.difficulty * 100).toFixed(0)}%
                  </span>
                  <h2 style={{ margin: ".6rem 0 0", fontSize: "1rem", color: "#17392c" }}>
                    {q.prompt}
                  </h2>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Active question */}
          <section style={{ marginTop: "2rem" }}>
            <button
              onClick={() => {
                setSelectedQ(null);
                setAttempt(0);
                setChatHistory([]);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#397a63",
                cursor: "pointer",
                font: '500 .78rem "DM Mono", monospace',
                padding: 0,
                marginBottom: ".8rem",
              }}
            >
              ← Back to questions
            </button>

            <div style={{
              padding: "1.2rem 1.5rem",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, #f9fdf9, #e5f6ec)",
              border: "1px solid rgba(21,51,40,0.1)",
              marginBottom: "1.5rem",
            }}>
              <span style={{ color: "#4d8b72", font: '500 .7rem "DM Mono", monospace' }}>
                {CONCEPT_NAMES[selectedQ.concept_id] || selectedQ.concept_id}
              </span>
              <h2 style={{ margin: ".4rem 0 0", fontSize: "1.2rem", color: "#17392c" }}>
                {selectedQ.prompt}
              </h2>

              {/* Escalation ladder indicator */}
              <div style={{
                display: "flex",
                gap: ".4rem",
                marginTop: ".8rem",
                flexWrap: "wrap",
              }}>
                {Object.entries(MODE_DISPLAY).map(([mode, info]) => {
                  const isActive = chatHistory.some((m) => m.mode === mode);
                  return (
                    <span
                      key={mode}
                      style={{
                        padding: ".2rem .5rem",
                        borderRadius: ".35rem",
                        fontSize: ".68rem",
                        fontWeight: 600,
                        background: isActive
                          ? `${info.color}18`
                          : "rgba(0,0,0,0.04)",
                        color: isActive ? info.color : "#aaa",
                        border: `1px solid ${isActive ? info.color + "30" : "transparent"}`,
                        transition: "all .2s ease",
                      }}
                    >
                      {info.icon} {info.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Chat history */}
          <section
            style={{
              display: "grid",
              gap: ".6rem",
              maxHeight: "400px",
              overflowY: "auto",
              marginBottom: "1rem",
              padding: ".5rem 0",
            }}
            aria-label="Tutor conversation"
          >
            {chatHistory.map((msg, idx) => {
              const modeInfo = msg.mode ? MODE_DISPLAY[msg.mode] : null;
              return (
                <div
                  key={idx}
                  style={{
                    padding: ".8rem 1rem",
                    borderRadius: ".8rem",
                    background: msg.role === "tutor" ? "#fff" : "linear-gradient(135deg, #e0f4e7, #d0f5e4)",
                    border: msg.role === "tutor"
                      ? "1px solid rgba(21,51,40,0.09)"
                      : "1px solid rgba(26,92,63,0.15)",
                    boxShadow: msg.role === "tutor"
                      ? "0 6px 20px rgba(21,51,40,0.05)"
                      : "none",
                    maxWidth: msg.role === "learner" ? "75%" : "100%",
                    marginLeft: msg.role === "learner" ? "auto" : 0,
                  }}
                >
                  {msg.role === "tutor" && modeInfo && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".4rem",
                      marginBottom: ".3rem",
                    }}>
                      <span style={{
                        fontSize: ".7rem",
                        fontWeight: 600,
                        color: modeInfo.color,
                        background: `${modeInfo.color}12`,
                        padding: ".15rem .4rem",
                        borderRadius: ".3rem",
                      }}>
                        {modeInfo.icon} {modeInfo.label}
                      </span>
                      {msg.isFallback && (
                        <span style={{
                          fontSize: ".65rem",
                          color: "#888",
                          background: "rgba(0,0,0,0.04)",
                          padding: ".1rem .3rem",
                          borderRadius: ".2rem",
                        }}>
                          authored fallback
                        </span>
                      )}
                      {msg.confidence && (
                        <span style={{
                          fontSize: ".65rem",
                          color: "#6a8478",
                          font: '.65rem "DM Mono", monospace',
                        }}>
                          confidence: {msg.confidence}
                        </span>
                      )}
                    </div>
                  )}
                  <p style={{
                    margin: 0,
                    color: msg.role === "tutor" ? "#17392c" : "#1a5c3f",
                    fontSize: ".9rem",
                    lineHeight: 1.55,
                  }}>
                    {msg.content}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Hint options (clickable buttons) */}
          {!solved && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".4rem",
              marginBottom: "1rem",
            }}>
              <button
                onClick={() => handleAction(undefined, 0)}
                disabled={loading}
                style={{
                  border: "1px solid #4d8b72",
                  borderRadius: ".5rem",
                  padding: ".4rem .8rem",
                  background: attempt === 0 ? "#eef6f3" : "#fff",
                  color: "#31644e",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                💭 Socratic Hint
              </button>
              <button
                onClick={() => handleAction(undefined, 1)}
                disabled={loading || attempt < 1}
                style={{
                  border: "1px solid #c5a600",
                  borderRadius: ".5rem",
                  padding: ".4rem .8rem",
                  background: attempt === 1 ? "#fffbea" : "#fff",
                  color: "#8a7400",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  cursor: attempt < 1 ? "not-allowed" : "pointer",
                  opacity: attempt < 1 ? 0.5 : 1,
                }}
              >
                🔍 Error Explanation
              </button>
              <button
                onClick={() => handleAction(undefined, 2)}
                disabled={loading || attempt < 2}
                style={{
                  border: "1px solid #e67e22",
                  borderRadius: ".5rem",
                  padding: ".4rem .8rem",
                  background: attempt === 2 ? "#fdf5ee" : "#fff",
                  color: "#ba5a0d",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  cursor: attempt < 2 ? "not-allowed" : "pointer",
                  opacity: attempt < 2 ? 0.5 : 1,
                }}
              >
                📐 Worked Step
              </button>
              <button
                onClick={() => handleAction(undefined, 3)}
                disabled={loading || attempt < 3}
                style={{
                  border: "1px solid #b44",
                  borderRadius: ".5rem",
                  padding: ".4rem .8rem",
                  background: attempt === 3 ? "#fdeded" : "#fff",
                  color: "#8e2b2b",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  cursor: attempt < 3 ? "not-allowed" : "pointer",
                  opacity: attempt < 3 ? 0.5 : 1,
                }}
              >
                📖 Direct Explanation
              </button>
            </div>
          )}

          {/* Input area */}
          {!solved && (
            <div style={{
              display: "flex",
              gap: ".6rem",
              padding: ".8rem",
              borderRadius: ".8rem",
              background: "#fff",
              border: "1px solid rgba(21,51,40,0.1)",
              boxShadow: "0 10px 30px rgba(21,51,40,0.06)",
            }}>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAction();
                  }
                }}
                placeholder="Type your answer and press Enter..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: ".5rem .7rem",
                  fontSize: ".9rem",
                  fontFamily: "inherit",
                  borderRadius: ".5rem",
                  background: "rgba(21,51,40,0.03)",
                  color: "#17392c",
                }}
                disabled={loading}
                id="tutor-answer-input"
              />
              <button
                onClick={() => handleAction()}
                disabled={loading}
                style={{
                  border: "none",
                  borderRadius: ".6rem",
                  padding: ".5rem 1.2rem",
                  background: "linear-gradient(135deg, #4d8b72, #3a7a5f)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: ".85rem",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "opacity .2s ease",
                }}
                id="tutor-submit-btn"
              >
                Submit Answer
              </button>
            </div>
          )}

          {solved && (
            <div style={{
              marginTop: "1.5rem",
              padding: "1rem",
              borderRadius: "0.8rem",
              backgroundColor: "#f5fdf8",
              border: "1px solid #c2eed5",
              textAlign: "center",
            }}>
              <p style={{ margin: 0, color: "#1e6b3f", fontSize: "0.95rem", fontWeight: 600 }}>
                Question resolved!
              </p>
              <button
                onClick={() => {
                  setSelectedQ(null);
                  setAttempt(0);
                  setChatHistory([]);
                  setSolved(false);
                }}
                style={{
                  marginTop: "0.8rem",
                  border: "none",
                  borderRadius: ".5rem",
                  padding: ".4rem 1rem",
                  background: "#267a4e",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: ".8rem",
                  cursor: "pointer",
                }}
              >
                Select another question
              </button>
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
