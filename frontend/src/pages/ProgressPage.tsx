/**
 * ProgressPage — Magoosh-inspired mastery evidence history.
 *
 * Shows per-subject Results Summary with donut charts,
 * subject filter pills, stat cards, concept progress bars,
 * and an evidence timeline drill-down.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PageTransition } from "../components/PageTransition";
import { MasteryBadge } from "../components/MasteryBadge";
import { DonutChart } from "../components/DonutChart";
import {
  fetchProgress,
  fetchConceptEvidence,
  fetchDemoLearner,
  type MasteryState,
  type TimelineEntry,
} from "../api/tutorAnalytics";
import { CONCEPT_NAMES } from "./TutorPage";

const SUBJECT_MAP: Record<string, string> = {
  "num.": "Math",
  "eq.": "Math",
  sci: "Science",
  eng: "English",
};

function getSubject(conceptId: string): string {
  for (const [prefix, subject] of Object.entries(SUBJECT_MAP)) {
    if (conceptId.startsWith(prefix)) return subject;
  }
  return "Math";
}

interface SubjectAgg {
  subject: string;
  avgMastery: number;
  totalEvidence: number;
  totalCorrect: number;
  concepts: MasteryState[];
}

function aggregateBySubject(concepts: MasteryState[]): SubjectAgg[] {
  const map = new Map<string, MasteryState[]>();
  for (const c of concepts) {
    const subj = getSubject(c.concept_id);
    if (!map.has(subj)) map.set(subj, []);
    map.get(subj)!.push(c);
  }
  const result: SubjectAgg[] = [];
  for (const [subject, items] of map) {
    const avg = items.reduce((s, i) => s + i.p_know, 0) / items.length;
    const totalEvidence = items.reduce((s, i) => s + i.evidence_count, 0);
    const totalCorrect = items.reduce((s, i) => s + i.independent_correct_count, 0);
    result.push({ subject, avgMastery: avg, totalEvidence, totalCorrect, concepts: items });
  }
  return result;
}

const FILTERS = ["All", "Math", "Science", "English"];
const DONUT_COLORS: Record<string, string> = {
  Math: "#553285",
  Science: "#1bb576",
  English: "#e67e22",
};

export function ProgressPage() {
  const [concepts, setConcepts] = useState<MasteryState[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const timelineRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchDemoLearner()
      .then((demo) => {
        setLearnerId(demo.learner_id);
        return fetchProgress(demo.learner_id);
      })
      .then((data) => {
        setConcepts(data.concepts);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleConceptClick = useCallback((conceptId: string) => {
    if (!learnerId) return;
    setSelectedConcept(conceptId);
    fetchConceptEvidence(learnerId, conceptId)
      .then((data) => {
        setTimeline(data.timeline);
        setTimeout(() => timelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      })
      .catch(() => setTimeline([]));
  }, []);

  const allSubjects = aggregateBySubject(concepts);
  const filtered =
    filter === "All"
      ? allSubjects
      : allSubjects.filter((s) => s.subject === filter);

  const totalEvidence = concepts.reduce((s, c) => s + c.evidence_count, 0);
  const totalCorrect = concepts.reduce((s, c) => s + c.independent_correct_count, 0);
  const overallMastery =
    concepts.length > 0
      ? Math.round((concepts.reduce((s, c) => s + c.p_know, 0) / concepts.length) * 100)
      : 0;

  return (
    <PageTransition className="dashboard-page mg-page">
      {/* Breadcrumb */}
      <div className="mg-breadcrumb">
        <a href="/learn">Home</a>
        <span>›</span>
        <span>Analytics</span>
      </div>

      <h1 style={{ maxWidth: "20ch", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        Analytics
      </h1>

      {/* Filter pills */}
      <div className="mg-filter-bar" style={{ marginTop: "1.5rem" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`mg-filter-pill ${filter === f ? "mg-filter-pill--active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === filter && "✓ "}
            {f}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: ".5rem" }}>
          <button className="mg-filter-pill mg-filter-pill--active">All Time</button>
          <button className="mg-filter-pill">Custom</button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#636e72", marginTop: "2rem" }}>Loading evidence…</p>
      ) : error ? (
        <p style={{ color: "#d63031", marginTop: "2rem" }}>Error: {error}</p>
      ) : (
        <>
          {/* Performance and Study Activity — stat cards */}
          <h2 className="mg-section-title">Performance and Study Activity</h2>
          <div className="mg-stat-grid">
            <div className="mg-stat-card">
              <div className="mg-stat-card__title">Questions</div>
              <div className="mg-stat-card__value">{totalEvidence}</div>
              <div className="mg-stat-card__sub">Answered</div>
            </div>
            <div className="mg-stat-card">
              <div className="mg-stat-card__title">Performance</div>
              <div className="mg-donut-wrap">
                <DonutChart
                  value={overallMastery}
                  size={90}
                  strokeWidth={8}
                  color="#553285"
                  label={`${overallMastery}%`}
                  labelSize={18}
                />
              </div>
            </div>
            <div className="mg-stat-card">
              <div className="mg-stat-card__title">Correct Answers</div>
              <div className="mg-stat-card__value">{totalCorrect}</div>
              <div className="mg-stat-card__sub">Independent</div>
            </div>
            <div className="mg-stat-card">
              <div className="mg-stat-card__title">Concepts</div>
              <div className="mg-stat-card__value">{concepts.length}</div>
              <div className="mg-stat-card__sub">Tracked</div>
            </div>
          </div>

          {/* Results Summary — donut charts per subject */}
          <h2 className="mg-section-title" style={{ marginTop: "2.5rem" }}>
            Results Summary
          </h2>
          <div className="mg-results-row">
            {allSubjects.map((subj) => {
              const pct = Math.round(subj.avgMastery * 100);
              return (
                <div className="mg-result-card" key={subj.subject}>
                  <div className="mg-result-card__title">{subj.subject}</div>
                  <div className="mg-donut-wrap" style={{ margin: ".8rem 0" }}>
                    <DonutChart
                      value={pct}
                      size={110}
                      strokeWidth={10}
                      color={DONUT_COLORS[subj.subject] ?? "#553285"}
                    />
                  </div>
                  <div style={{ fontSize: ".85rem", color: "#636e72" }}>
                    Questions Answered: <strong>{subj.totalEvidence}</strong>
                  </div>
                  <button
                    className="mg-btn"
                    style={{ marginTop: ".8rem" }}
                    onClick={() => setFilter(subj.subject)}
                  >
                    View Analytics
                  </button>
                </div>
              );
            })}
          </div>

          {/* Subject breakdown — progress bars per concept */}
          {filtered.map((subj) => (
            <section key={subj.subject} style={{ marginTop: "2.5rem" }}>
              <h2 className="mg-section-title" style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                <span style={{
                  display: "inline-grid", placeItems: "center",
                  width: 32, height: 32, borderRadius: 8,
                  background: DONUT_COLORS[subj.subject] ?? "#553285",
                  color: "#fff", fontSize: ".9rem",
                }}>
                  {subj.subject === "Math" ? "🔢" : subj.subject === "Science" ? "🔬" : "📚"}
                </span>
                {subj.subject}
              </h2>
              <div className="mg-card">
                {subj.concepts.map((c) => {
                  const pct = Math.round(c.p_know * 100);
                  const isSelected = selectedConcept === c.concept_id;
                  return (
                    <div
                      className="mg-progress-row"
                      key={c.concept_id}
                      onClick={() => handleConceptClick(c.concept_id)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "rgba(85,50,133,0.03)" : undefined,
                        borderRadius: isSelected ? "8px" : undefined,
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleConceptClick(c.concept_id);
                        }
                      }}
                    >
                      <div>
                        <div className="mg-progress-label">
                          {CONCEPT_NAMES[c.concept_id] || c.concept_id}
                        </div>
                        <div className="mg-progress-sub">
                          {c.independent_correct_count} of {c.evidence_count} correct
                        </div>
                      </div>
                      <div className="mg-progress-track">
                        <div
                          className="mg-progress-fill"
                          style={{ width: `${Math.max(pct, 5)}%` }}
                        >
                          {pct}%
                        </div>
                      </div>
                      <div className="mg-progress-actions">
                        <button className="mg-btn" onClick={(e) => { e.stopPropagation(); handleConceptClick(c.concept_id); }}>
                          More Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Evidence timeline drill-down */}
          {selectedConcept !== null && (
            <section ref={timelineRef} style={{ marginTop: "2.5rem" }} aria-label="Evidence timeline">
              <h2 className="mg-section-title">
                Evidence Timeline — {CONCEPT_NAMES[selectedConcept] || selectedConcept}
              </h2>
              {timeline.length === 0 ? (
                <p style={{ color: "#636e72" }}>Loading timeline…</p>
              ) : (
                <div style={{ display: "grid", gap: ".6rem" }}>
                  {timeline.map((entry, idx) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2.5rem 4px minmax(0, 1fr)",
                        gap: ".8rem",
                        alignItems: "center",
                      }}
                    >
                      {/* Step number */}
                      <span
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: "2.2rem",
                          height: "2.2rem",
                          borderRadius: ".6rem",
                          background: "#553285",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: ".7rem",
                          fontFamily: '"Inter", sans-serif',
                        }}
                      >
                        {idx + 1}
                      </span>
                      {/* Connector bar */}
                      <div
                        style={{
                          width: "4px",
                          height: "100%",
                          minHeight: "2.5rem",
                          borderRadius: "2px",
                          background:
                            entry.p_know >= 0.7
                              ? "#1bb576"
                              : entry.p_know >= 0.4
                                ? "#e67e22"
                                : "#d63031",
                        }}
                      />
                      {/* Entry card */}
                      <div className="mg-card" style={{ padding: ".7rem .9rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
                          <strong style={{ color: "#2d3436", fontSize: ".9rem" }}>
                            {(entry.p_know * 100).toFixed(0)}%
                          </strong>
                          <MasteryBadge
                            pKnow={entry.p_know}
                            band={entry.band}
                            message={entry.learner_message}
                            size="sm"
                          />
                          {entry.hint_used && (
                            <span className="mg-pill mg-pill--orange">hint used</span>
                          )}
                        </div>
                        <p style={{ margin: ".3rem 0 0", color: "#636e72", fontSize: ".75rem" }}>
                          {entry.evidence_count} evidence · {entry.independent_correct_count} independent
                          {entry.recent_error_tags.length > 0
                            ? ` · Errors: ${entry.recent_error_tags.map((t) => t.replace(/_/g, " ").replace(/\beq\.|num\./g, "")).join(", ")}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </PageTransition>
  );
}
