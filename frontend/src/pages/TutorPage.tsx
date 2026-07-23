/**
 * TutorPage — Magoosh-inspired structured Socratic tutor interface.
 *
 * Features:
 *   - Uses the logged-in user's email as learner_id (no manual dropdown)
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
  fetchQuestions,
  fetchProgress,
  postGuidance,
  postTutorRespond,
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

/* Map question / concept_id → subject for filtering */
function getSubjectForConcept(q: QuestionSummary): string {
  if (q.subject) return q.subject;
  const conceptId = q.concept_id || "";
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

const HINT_BUTTONS: { key: string; label: string; color: string; border: string; bg: string; tooltip: string; attemptIndex: number }[] = [
  {
    key: "hint",
    label: "💭 Get a Hint",
    color: "#1bb576",
    border: "#1bb576",
    bg: "rgba(27,181,118,.06)",
    tooltip: "A guiding question or clue to help you think through the problem",
    attemptIndex: 0,
  },
  {
    key: "solution",
    label: "📖 Show Solution",
    color: "#d63031",
    border: "#d63031",
    bg: "rgba(214,48,49,.06)",
    tooltip: "See the complete worked solution with step-by-step explanation",
    attemptIndex: 3,
  },
];

const QUICK_OPTIONS = [
  { text: "Am I on track?", type: "am_i_on_track" },
  { text: "What should I study next?", type: "what_to_study_next" },
  { text: "Recommend practice questions", type: "recommend_practice" },
];

/* Difficulty float → user-facing label + color */
function getDifficultyLabel(d: number): { label: string; color: string; bg: string } {
  if (d <= 0.35) return { label: "Easy", color: "#1bb576", bg: "rgba(27,181,118,.08)" };
  if (d <= 0.55) return { label: "Medium", color: "#e67e22", bg: "rgba(230,126,34,.08)" };
  return { label: "Hard", color: "#d63031", bg: "rgba(214,48,49,.08)" };
}

/* Question type display */
function getQuestionTypeLabel(qt?: string): { label: string; icon: string } {
  switch (qt) {
    case "mcq": return { label: "MCQ", icon: "☑️" };
    case "numeric": return { label: "Numeric", icon: "🔢" };
    case "multiple_correct": return { label: "Multi-Select", icon: "☑️" };
    case "short_answer": return { label: "Short Answer", icon: "✏️" };
    default: return { label: "MCQ", icon: "☑️" };
  }
}

/* Parent chapter grouping — groups related concepts under one NCERT-aligned chapter */
const CHAPTER_GROUPS: { key: string; chapter: string; concepts: string[]; subject: string }[] = [
  // Math
  { key: "ch_linear_eq", chapter: "Linear Equations — Foundations", concepts: ["num.signed_operations", "eq.inverse_operations", "num.mul_div_fluency", "math.linear_equations", "eq.multi_step", "eq.word_translation"], subject: "mathematics" },
  { key: "ch_rational", chapter: "Rational Numbers", concepts: ["math.rational_numbers"], subject: "mathematics" },
  { key: "ch_quadrilaterals", chapter: "Understanding Quadrilaterals", concepts: ["math.quadrilaterals"], subject: "mathematics" },
  { key: "ch_data", chapter: "Data Handling", concepts: ["math.data_handling"], subject: "mathematics" },
  { key: "ch_squares", chapter: "Squares and Square Roots", concepts: ["math.squares_roots"], subject: "mathematics" },
  // Science
  { key: "ch_crop", chapter: "Crop Production and Management", concepts: ["sci.crop_production"], subject: "science" },
  { key: "ch_micro", chapter: "Microorganisms: Friend and Foe", concepts: ["sci.microorganisms"], subject: "science" },
  { key: "ch_coal", chapter: "Coal and Petroleum", concepts: ["sci.coal_petroleum"], subject: "science" },
  { key: "ch_combust", chapter: "Combustion and Flame", concepts: ["sci.combustion_flame"], subject: "science" },
  { key: "ch_conserve", chapter: "Conservation of Plants and Animals", concepts: ["sci.conservation"], subject: "science" },
  // English
  { key: "ch_xmas", chapter: "The Best Christmas Present in the World", concepts: ["eng.christmas_present"], subject: "english" },
  { key: "ch_tsunami", chapter: "The Tsunami", concepts: ["eng.tsunami"], subject: "english" },
  { key: "ch_glimpses", chapter: "Glimpses of the Past", concepts: ["eng.glimpses_past"], subject: "english" },
  { key: "ch_bepin", chapter: "Bepin Choudhury's Lapse of Memory", concepts: ["eng.bepin_choudhury"], subject: "english" },
  { key: "ch_summit", chapter: "The Summit Within", concepts: ["eng.summit_within"], subject: "english" },
];

/* Group questions by parent chapter, with topic labels per concept */
function groupByChapter(
  questions: QuestionSummary[],
  activeSubjectFilter: string
): { chapter: string; chapterName: string; questions: (QuestionSummary & { topicName?: string })[] }[] {
  const groups: { chapter: string; chapterName: string; questions: (QuestionSummary & { topicName?: string })[] }[] = [];
  const assigned = new Set<string>();

  const relevantChapterGroups = activeSubjectFilter === "all"
    ? CHAPTER_GROUPS
    : CHAPTER_GROUPS.filter((cg) => cg.subject === activeSubjectFilter);

  for (const cg of relevantChapterGroups) {
    const qs = questions
      .filter((q) => cg.concepts.includes(q.concept_id))
      .map((q) => ({ ...q, topicName: CONCEPT_NAMES[q.concept_id] || q.concept_id }))
      .sort((a, b) => a.difficulty - b.difficulty);
    if (qs.length > 0) {
      groups.push({ chapter: cg.key, chapterName: cg.chapter, questions: qs });
      qs.forEach((q) => assigned.add(q.id));
    }
  }

  // Catch any ungrouped questions
  const ungrouped = questions.filter((q) => !assigned.has(q.id));
  if (ungrouped.length > 0) {
    const map = new Map<string, (QuestionSummary & { topicName?: string })[]>();
    for (const q of ungrouped) {
      const key = q.concept_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ ...q, topicName: CONCEPT_NAMES[q.concept_id] || q.concept_id });
    }
    for (const [concept, qs] of map) {
      qs.sort((a, b) => a.difficulty - b.difficulty);
      groups.push({ chapter: concept, chapterName: CONCEPT_NAMES[concept] || concept, questions: qs });
    }
  }

  return groups;
}

interface ChatMessage {
  role: "tutor" | "learner";
  content: string;
  mode?: string;
  isFallback?: boolean;
  confidence?: string;
}

export function TutorPage() {
  /* Read logged-in user email from session — used as learner_id for all API calls */
  const learnerId = (() => {
    try {
      const stored = localStorage.getItem("prism_user");
      if (stored) {
        const user = JSON.parse(stored);
        return (user.email as string) || "aanya@prism.demo";
      }
    } catch { /* ignore */ }
    return "aanya@prism.demo";
  })();
  const learnerName = (() => {
    try {
      const stored = localStorage.getItem("prism_user");
      if (stored) {
        const user = JSON.parse(stored);
        return (user.username || user.email?.split("@")[0] || "Learner") as string;
      }
    } catch { /* ignore */ }
    return "Learner";
  })();

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
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [userConceptsMap, setUserConceptsMap] = useState<Record<string, { evidenceCount: number; indepCount: number; pKnow: number }>>({});

  /* Load questions and user concept progress */
  useEffect(() => {
    fetchQuestions()
      .then((data) => {
        setQuestions(data.questions);
        setQuestionsLoading(false);
      })
      .catch(() => setQuestionsLoading(false));
  }, []);

  useEffect(() => {
    if (!learnerId) return;
    fetchProgress(learnerId)
      .then((data) => {
        const map: Record<string, { evidenceCount: number; indepCount: number; pKnow: number }> = {};
        data.concepts.forEach((c) => {
          map[c.concept_id] = {
            evidenceCount: c.evidence_count,
            indepCount: c.independent_correct_count,
            pKnow: c.p_know,
          };
        });
        setUserConceptsMap(map);
      })
      .catch(() => {});
  }, [learnerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  /* Filter questions by subject */
  const filteredQuestions = subjectFilter === "all"
    ? questions
    : questions.filter((q) => getSubjectForConcept(q) === subjectFilter);

  const handleSelectQuestion = useCallback(
    (q: QuestionSummary) => {
      setSelectedQ(q);
      setAttempt(0);
      setChatHistory([
        {
          role: "tutor",
          content: `Hi ${learnerName.split(" ")[0]}! Let's work on: "${q.prompt}"`,
          mode: "socratic_hint",
        },
      ]);
      setAnswer("");
      setSolved(false);
    },
    [learnerName],
  );

  /* Handle guidance quick options */
  const handleGuidance = useCallback(
    async (questionType: string, displayText: string) => {
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

        // Update local concept progress map so attempted/solved badge updates instantly
        setUserConceptsMap((prev) => {
          const current = prev[selectedQ.concept_id] || { evidenceCount: 0, indepCount: 0, pKnow: 0.15 };
          return {
            ...prev,
            [selectedQ.concept_id]: {
              evidenceCount: current.evidenceCount + 1,
              indepCount: resp.is_correct ? current.indepCount + 1 : current.indepCount,
              pKnow: resp.p_know ?? current.pKnow,
            },
          };
        });
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

      {/* Learner identity banner */}
      <div style={{ display: "flex", gap: ".6rem", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontWeight: 600, fontSize: ".85rem", color: "#2d3436", fontFamily: '"Inter", sans-serif' }}>
          👤 {learnerName}
        </span>
        {learnerId && (
          <span style={{ fontSize: ".75rem", color: "#636e72", fontFamily: '"Inter", sans-serif' }}>
            {learnerId}
          </span>
        )}
      </div>

      {/* Subject filter pills — only when viewing question list */}
      {!selectedQ && (
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
      )}

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
              {groupByChapter(filteredQuestions, subjectFilter).map((group) => {
                const isCollapsed = collapsedChapters.has(group.chapter);
                return (
                  <div key={group.chapter} style={{ marginBottom: "1rem" }}>
                    {/* Chapter header — collapsible */}
                    <button
                      onClick={() => {
                        setCollapsedChapters((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.chapter)) next.delete(group.chapter);
                          else next.add(group.chapter);
                          return next;
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ".5rem",
                        width: "100%",
                        padding: ".6rem .8rem",
                        background: "rgba(85, 50, 133, 0.05)",
                        border: "1px solid rgba(85, 50, 133, 0.12)",
                        borderRadius: ".6rem",
                        cursor: "pointer",
                        fontFamily: '"Inter", sans-serif',
                        fontSize: ".85rem",
                        fontWeight: 700,
                        color: "#553285",
                        textAlign: "left",
                        transition: "background .15s ease",
                      }}
                    >
                      <span style={{ fontSize: ".7rem", transition: "transform .2s ease", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
                      <span>{group.chapterName}</span>
                      <span style={{
                        marginLeft: "auto",
                        fontSize: ".7rem",
                        fontWeight: 500,
                        color: "#636e72",
                        background: "rgba(0,0,0,.04)",
                        padding: ".15rem .5rem",
                        borderRadius: ".8rem",
                      }}>
                        {group.questions.length} question{group.questions.length !== 1 ? "s" : ""}
                      </span>
                    </button>

                    {/* Questions within chapter */}
                    {!isCollapsed && group.questions.map((q, idx) => {
                      const diff = getDifficultyLabel(q.difficulty);
                      const qType = getQuestionTypeLabel(q.question_type || q.answer_type);
                      return (
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
                          <div style={{ flex: 1 }}>
                            <div className="mg-lesson-badge" style={{ display: "flex", alignItems: "center", gap: ".4rem", flexWrap: "wrap" }}>
                              {/* Difficulty pill */}
                              <span style={{
                                display: "inline-block",
                                padding: ".12rem .45rem",
                                borderRadius: ".8rem",
                                fontSize: ".65rem",
                                fontWeight: 700,
                                color: diff.color,
                                background: diff.bg,
                                border: `1px solid ${diff.color}20`,
                              }}>
                                {diff.label}
                              </span>
                              {/* Question type pill */}
                              <span style={{
                                display: "inline-block",
                                padding: ".12rem .45rem",
                                borderRadius: ".8rem",
                                fontSize: ".65rem",
                                fontWeight: 600,
                                color: "#636e72",
                                background: "rgba(0,0,0,.04)",
                              }}>
                                {qType.icon} {qType.label}
                              </span>
                            </div>
                            <div className="mg-lesson-title">{q.prompt}</div>
                            {(q as QuestionSummary & { topicName?: string }).topicName && (
                              <span style={{
                                display: "inline-block",
                                marginTop: ".25rem",
                                padding: ".1rem .4rem",
                                borderRadius: ".6rem",
                                fontSize: ".62rem",
                                fontWeight: 600,
                                color: "#553285",
                                background: "rgba(85,50,133,.06)",
                                border: "1px solid rgba(85,50,133,.1)",
                              }}>
                                {(q as QuestionSummary & { topicName?: string }).topicName}
                              </span>
                            )}
                            {q.ncert_reference && (
                              <span style={{
                                display: "inline-block",
                                marginTop: ".25rem",
                                marginLeft: ".3rem",
                                padding: ".1rem .4rem",
                                borderRadius: ".6rem",
                                fontSize: ".62rem",
                                fontWeight: 600,
                                color: "#1bb576",
                                background: "rgba(27,181,118,.06)",
                                border: "1px solid rgba(27,181,118,.15)",
                              }}>
                                📚 {q.ncert_reference.book.split(" — ")[0]} · {q.ncert_reference.chapter.split(":")[0]}
                              </span>
                            )}
                          </div>
                          {(() => {
                            const prog = userConceptsMap[q.concept_id];
                            const isSolved = prog && (prog.indepCount > 0 || prog.pKnow >= 0.70);
                            const isAttempted = prog && prog.evidenceCount > 0;
                            if (isSolved) {
                              return (
                                <span className="mg-pill mg-pill--green" style={{ fontSize: ".72rem", padding: ".2rem .55rem" }}>
                                  ✓ Solved
                                </span>
                              );
                            }
                            if (isAttempted) {
                              return (
                                <span className="mg-pill mg-pill--orange" style={{ fontSize: ".72rem", padding: ".2rem .55rem" }}>
                                  📝 Attempted
                                </span>
                              );
                            }
                            return <span className="mg-lesson-meta">Q{idx + 1}</span>;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
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
              <div className="mg-hint-row" style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", marginTop: ".5rem" }}>
                {HINT_BUTTONS.map((hint) => (
                  <button
                    key={hint.key}
                    className="mg-hint-btn"
                    onClick={() => handleAction(undefined, hint.attemptIndex)}
                    disabled={loading}
                    style={{
                      borderColor: hint.border,
                      color: hint.color,
                      background: hint.bg,
                      flex: "1 1 auto",
                      minWidth: "8rem",
                    }}
                    title={hint.tooltip}
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
