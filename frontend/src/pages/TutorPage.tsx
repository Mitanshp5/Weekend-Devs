/**
 * TutorPage — Magoosh-inspired structured Socratic tutor interface.
 *
 * Features:
 *   - Demo learner dropdown selector with localStorage persistence
 *   - Subject filter pills (Math / Science / English)
 *   - AI Tutor featured promo card (Magoosh style)
 *   - Question selector as lesson list
 *   - Chat widget with quick-select guidance options
 *   - User-friendly hint buttons with info tooltips
 *   - Hint escalation ladder
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PageTransition } from "../components/PageTransition";
import {
  fetchLearners,
  fetchQuestions,
  postGuidance,
  postTutorRespond,
  type DemoLearner,
  type QuestionSummary,
  type TutorResponse,
} from "../api/tutorAnalytics";

export const CONCEPT_NAMES: Record<string, string> = {
  // Math
  "num.signed_operations": "Integer Operations (Signed Numbers)",
  "eq.inverse_operations": "Basic Equations (Inverse Operations)",
  "eq.multi_step": "Multi-Step Equations",
  "eq.word_translation": "Word Problems (Equation Translation)",
  "num.mul_div_fluency": "Multiplication & Division Fluency",
  "math.rational_numbers": "Rational Numbers",
  "math.linear_equations": "Linear Equations in One Variable",
  "math.quadrilaterals": "Understanding Quadrilaterals",
  "math.data_handling": "Data Handling",
  "math.squares_roots": "Squares and Square Roots",
  // Science
  "sci.crop_production": "Crop Production and Management",
  "sci.microorganisms": "Microorganisms: Friend and Foe",
  "sci.coal_petroleum": "Coal and Petroleum",
  "sci.combustion_flame": "Combustion and Flame",
  "sci.conservation": "Conservation of Plants and Animals",
  // English
  "eng.christmas_present": "The Best Christmas Present",
  "eng.tsunami": "The Tsunami",
  "eng.glimpses_past": "Glimpses of the Past",
  "eng.bepin_choudhury": "Bepin Choudhury's Lapse of Memory",
  "eng.summit_within": "The Summit Within",
};

/* Map concept_id prefix → subject for filtering */
function getSubjectForConcept(conceptId: string): string {
  if (conceptId.startsWith("math.") || conceptId.startsWith("num.") || conceptId.startsWith("eq.")) return "mathematics";
  if (conceptId.startsWith("sci.")) return "science";
  if (conceptId.startsWith("eng.")) return "english";
  return "mathematics";
}

const SUBJECT_FILTERS = [
  { key: "all", label: "All Subjects" },
  { key: "mathematics", label: "📐 Mathematics" },
  { key: "science", label: "🔬 Science" },
  { key: "english", label: "📖 English" },
];

/* Backend mode → user-facing display names */
const MODE_DISPLAY: Record<string, { label: string; userLabel: string; color: string; icon: string; tooltip: string }> = {
  socratic_hint: {
    label: "Socratic hint",
    userLabel: "Think About It",
    color: "#1bb576",
    icon: "💭",
    tooltip: "Socratic Hint — a question to guide your thinking without giving the answer",
  },
  explain_error: {
    label: "Error explanation",
    userLabel: "What Went Wrong",
    color: "#e67e22",
    icon: "🔍",
    tooltip: "Error Explanation — identifies the specific mistake in your approach",
  },
  worked_step: {
    label: "Worked step",
    userLabel: "Show Me a Step",
    color: "#553285",
    icon: "📐",
    tooltip: "Worked Step — walks through one key step of the solution",
  },
  direct_explanation: {
    label: "Direct explanation",
    userLabel: "Full Solution",
    color: "#d63031",
    icon: "📖",
    tooltip: "Direct Explanation — the complete worked solution",
  },
  check_thinking: {
    label: "Transfer check",
    userLabel: "Transfer Check",
    color: "#553285",
    icon: "🧠",
    tooltip: "Transfer Check — verifying you can apply the concept independently",
  },
};

const HINT_BUTTONS: { key: string; label: string; color: string; border: string; bg: string; tooltip: string }[] = [
  {
    key: "socratic_hint",
    label: "💭 Think About It",
    color: "#1bb576",
    border: "#1bb576",
    bg: "rgba(27,181,118,.06)",
    tooltip: "Socratic Hint — a question to guide your thinking without giving the answer",
  },
  {
    key: "explain_error",
    label: "🔍 What Went Wrong",
    color: "#e67e22",
    border: "#e67e22",
    bg: "rgba(230,126,34,.06)",
    tooltip: "Error Explanation — identifies the specific mistake in your approach",
  },
  {
    key: "worked_step",
    label: "📐 Show Me a Step",
    color: "#553285",
    border: "#553285",
    bg: "rgba(85,50,133,.06)",
    tooltip: "Worked Step — walks through one key step of the solution",
  },
  {
    key: "direct_explanation",
    label: "📖 Full Solution",
    color: "#d63031",
    border: "#d63031",
    bg: "rgba(214,48,49,.06)",
    tooltip: "Direct Explanation — the complete worked solution",
  },
];

const QUICK_OPTIONS = [
  { text: "Am I on track?", type: "am_i_on_track" },
  { text: "What should I study next?", type: "what_to_study_next" },
  { text: "Recommend practice questions", type: "recommend_practice" },
];

interface ChatMessage {
  role: "tutor" | "learner";
  content: string;
  mode?: string;
  isFallback?: boolean;
  confidence?: string;
}

const STORAGE_KEY = "prism_selected_learner";

export function TutorPage() {
  /* Learner state */
  const [learners, setLearners] = useState<DemoLearner[]>([]);
  const [learnerId, setLearnerId] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? "");
  const [learnerError, setLearnerError] = useState("");

  /* Subject filter */
  const [subjectFilter, setSubjectFilter] = useState("all");

  /* Tutor state */
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [selectedQ, setSelectedQ] = useState<QuestionSummary | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [solved, setSolved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* Load demo learners */
  useEffect(() => {
    fetchLearners()
      .then((data) => {
        setLearners(data.learners);
        // Auto-select first learner if none stored
        if (!learnerId && data.learners.length > 0) {
          const defaultId = String(data.learners[0].id);
          setLearnerId(defaultId);
          localStorage.setItem(STORAGE_KEY, defaultId);
        }
      })
      .catch(() => {});
  }, []);

  /* Load questions */
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

  /* Persist learner selection */
  const handleLearnerChange = useCallback((val: string) => {
    setLearnerId(val);
    setLearnerError("");
    localStorage.setItem(STORAGE_KEY, val);
  }, []);

  const selectedLearner = learners.find((l) => String(l.id) === learnerId);

  /* Filter questions by subject */
  const filteredQuestions = subjectFilter === "all"
    ? questions
    : questions.filter((q) => getSubjectForConcept(q.concept_id) === subjectFilter);

  const handleSelectQuestion = useCallback(
    (q: QuestionSummary) => {
      if (!learnerId) {
        setLearnerError("Please select a learner before starting a question.");
        return;
      }
      setSelectedQ(q);
      setAttempt(0);
      setChatHistory([
        {
          role: "tutor",
          content: `Hi${selectedLearner ? ` ${selectedLearner.name.split(" ")[0]}` : ""}! Let's work on: "${q.prompt}"`,
          mode: "socratic_hint",
        },
      ]);
      setAnswer("");
      setSolved(false);
    },
    [learnerId, selectedLearner],
  );

  /* Handle guidance quick options */
  const handleGuidance = useCallback(
    async (questionType: string, displayText: string) => {
      if (!learnerId) {
        setLearnerError("Please select a learner first.");
        return;
      }
      setLoading(true);
      setChatHistory((prev) => [...prev, { role: "learner", content: displayText }]);
      try {
        const resp = await postGuidance({
          learner_id: learnerId,
          question_type: questionType,
          subject: subjectFilter !== "all" ? subjectFilter : undefined,
        });
        setChatHistory((prev) => [
          ...prev,
          { role: "tutor", content: resp.message, mode: "socratic_hint" },
        ]);
      } catch {
        setChatHistory((prev) => [
          ...prev,
          { role: "tutor", content: "Something went wrong. Please try again.", mode: "error" },
        ]);
      }
      setLoading(false);
    },
    [learnerId, subjectFilter],
  );

  const handleAction = useCallback(
    async (forcedAnswer?: string, hintAttempt?: number) => {
      if (!selectedQ || loading) return;
      if (!learnerId) {
        setLearnerError("Please select a learner before submitting.");
        return;
      }
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

      const hintLabels = ["Think About It", "What Went Wrong", "Show Me a Step", "Full Solution"];
      const learnerMsg = isHint
        ? `Asked for ${hintLabels[hintAttempt] || "Hint"}`
        : submissionAnswer;

      setChatHistory((prev) => [...prev, { role: "learner", content: learnerMsg }]);

      try {
        const resp: TutorResponse = await postTutorRespond({
          learner_id: learnerId,
          question_id: selectedQ.id,
          attempt_number: isHint ? hintAttempt! : attempt,
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
            setAttempt(Math.min(hintAttempt! + 1, 3));
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
    [selectedQ, attempt, answer, loading, learnerId],
  );

  return (
    <PageTransition className="dashboard-page mg-page">
      {/* Breadcrumb */}
      <div className="mg-breadcrumb">
        <a href="/learn">Home</a>
        <span>›</span>
        <span>PRISM AI Tutor</span>
      </div>

      {/* Learner selector */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
        <label className="mg-learner-input" style={{ display: "flex", alignItems: "center", gap: ".5rem", margin: 0 }}>
          <span style={{ fontWeight: 600, fontSize: ".85rem", color: "#2d3436", fontFamily: '"Inter", sans-serif', whiteSpace: "nowrap" }}>
            👤 Learner
          </span>
          <select
            value={learnerId}
            onChange={(e) => handleLearnerChange(e.target.value)}
            style={{
              padding: ".4rem .6rem",
              borderRadius: ".4rem",
              border: "1px solid #dfe6e9",
              fontSize: ".85rem",
              fontFamily: '"Inter", sans-serif',
              color: "#2d3436",
              minWidth: "180px",
              cursor: "pointer",
            }}
            id="learner-selector"
          >
            <option value="">Select a student...</option>
            {learners.map((l) => (
              <option key={l.id} value={String(l.id)}>
                {l.id}. {l.name}
              </option>
            ))}
          </select>
        </label>
        {selectedLearner && (
          <span style={{ fontSize: ".78rem", color: "#636e72", fontFamily: '"Inter", sans-serif' }}>
            {selectedLearner.description}
          </span>
        )}
      </div>
      {learnerError && (
        <div style={{
          background: "rgba(214,48,49,.08)",
          border: "1px solid rgba(214,48,49,.2)",
          borderRadius: ".4rem",
          padding: ".5rem .8rem",
          marginBottom: "1rem",
          color: "#d63031",
          fontSize: ".82rem",
          fontWeight: 600,
          fontFamily: '"Inter", sans-serif',
        }}>
          ⚠️ {learnerError}
        </div>
      )}

      {/* Subject filter pills */}
      <div style={{ display: "flex", gap: ".4rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
        {SUBJECT_FILTERS.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setSubjectFilter(sf.key)}
            className="mg-pill"
            style={{
              cursor: "pointer",
              background: subjectFilter === sf.key ? "#553285" : "#fff",
              color: subjectFilter === sf.key ? "#fff" : "#553285",
              border: `1px solid ${subjectFilter === sf.key ? "#553285" : "#dfe6e9"}`,
              padding: ".3rem .7rem",
              fontSize: ".78rem",
              fontWeight: 600,
              fontFamily: '"Inter", sans-serif',
              borderRadius: "1rem",
              transition: "all .15s ease",
            }}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {/* AI Tutor featured card */}
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
              Your Personal STEM Learning Guide
            </h2>
            <p style={{
              margin: 0, color: "#636e72", fontSize: ".9rem",
              lineHeight: 1.6, fontFamily: '"Inter", sans-serif',
            }}>
              Select a question below to practice, or ask the tutor:
            </p>
            <div className="mg-quick-options" style={{ marginTop: ".6rem" }}>
              {QUICK_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  className="mg-quick-option"
                  onClick={() => handleGuidance(opt.type, opt.text)}
                  disabled={loading}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            {/* Show guidance chat if messages exist without a selected question */}
            {chatHistory.length > 0 && (
              <div className="mg-chat-widget" style={{ marginTop: "1rem" }}>
                <div className="mg-chat-body" style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {chatHistory.map((msg, idx) => (
                    <div key={idx}>
                      <div className={`mg-chat-bubble ${msg.role === "tutor" ? "mg-chat-bubble--tutor" : "mg-chat-bubble--learner"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Question selector / Chat interface */}
      {!selectedQ ? (
        <section aria-label="Select a question">
          <h2 className="mg-section-title">
            Choose a question to work on
            {subjectFilter !== "all" && (
              <span style={{ fontWeight: 400, fontSize: ".85rem", color: "#636e72" }}>
                {" "}— {SUBJECT_FILTERS.find((f) => f.key === subjectFilter)?.label}
              </span>
            )}
          </h2>
          {questionsLoading ? (
            <p style={{ color: "#636e72" }}>Loading questions…</p>
          ) : filteredQuestions.length === 0 ? (
            <p style={{ color: "#636e72" }}>No questions available for this subject yet.</p>
          ) : (
            <div className="mg-lesson-list">
              {filteredQuestions.map((q, idx) => (
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
            </div>


            {/* Hint buttons with tooltips */}
            {!solved && (
              <div className="mg-hint-row">
                {HINT_BUTTONS.map((hint, idx) => (
                  <div key={idx} style={{ position: "relative", display: "inline-block" }}>
                    <button
                      className="mg-hint-btn"
                      onClick={() => handleAction(undefined, idx)}
                      disabled={loading}
                      style={{
                        borderColor: hint.border,
                        color: hint.color,
                        background: attempt === idx ? hint.bg : "#fff",
                      }}
                      title={hint.tooltip}
                    >
                      {hint.label}
                      <span style={{
                        marginLeft: ".3rem",
                        fontSize: ".6rem",
                        opacity: 0.6,
                        cursor: "help",
                      }}>
                        ℹ️
                      </span>
                    </button>
                  </div>
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
                    Type your answer below or use a hint button
                  </p>
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
                          {modeInfo.icon} {modeInfo.userLabel}
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
              <>
                {/* MCQ option buttons */}
                {selectedQ.options && selectedQ.options.length > 0 && (
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: ".4rem",
                    padding: ".5rem .8rem", borderTop: "1px solid #f0f0f0",
                  }}>
                    {selectedQ.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <button
                          key={idx}
                          className="mg-btn"
                          onClick={() => handleAction(letter)}
                          disabled={loading}
                          style={{
                            flex: "1 1 45%",
                            fontSize: ".78rem",
                            padding: ".4rem .6rem",
                            textAlign: "left",
                            borderColor: "#dfe6e9",
                            fontFamily: '"Inter", sans-serif',
                          }}
                        >
                          <strong style={{ color: "#553285" }}>{letter}.</strong> {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
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
                    placeholder={selectedQ.options ? "Or type A, B, C, D..." : "Type your answer..."}
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
              </>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}
