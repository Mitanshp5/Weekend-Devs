/**
 * ProgressPage — mastery evidence history for a learner.
 *
 * Shows per-concept mastery states with band classification,
 * a timeline chart, and an evidence ledger drill-down.
 *
 * Applies frontend-design skill: intentional typography, evidence-led design,
 * and the PRISM dashboard light theme.
 * Applies vercel-react-best-practices: no barrel imports, functional setState,
 * early return, conditional rendering via ternary.
 */

import { useCallback, useEffect, useState } from "react";
import { PageTransition } from "../components/PageTransition";
import { MasteryBadge } from "../components/MasteryBadge";
import { fetchProgress, fetchConceptEvidence, type MasteryState, type TimelineEntry } from "../api/person3";
import { CONCEPT_NAMES } from "./TutorPage";

const DEMO_LEARNER = "student-02";

export function ProgressPage() {
  const [concepts, setConcepts] = useState<MasteryState[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgress(DEMO_LEARNER)
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
    setSelectedConcept(conceptId);
    fetchConceptEvidence(DEMO_LEARNER, conceptId)
      .then((data) => setTimeline(data.timeline))
      .catch(() => setTimeline([]));
  }, []);

  return (
    <PageTransition className="dashboard-page">
      <p className="eyebrow">Mastery evidence</p>
      <h1>Your progress</h1>
      <p className="page-copy">
        Each concept shows the evidence behind your mastery — not just a score.
        Click a concept to see how your understanding evolved over time.
      </p>

      {loading ? (
        <p style={{ color: "#6a8478", marginTop: "2rem" }}>Loading evidence…</p>
      ) : error ? (
        <p style={{ color: "#b44", marginTop: "2rem" }}>Error: {error}</p>
      ) : (
        <>
          {/* Concept mastery cards */}
          <section
            className="placeholder-grid"
            style={{ marginTop: "2rem" }}
            aria-label="Concept mastery overview"
          >
            {concepts.map((c) => (
              <article
                key={c.concept_id}
                onClick={() => handleConceptClick(c.concept_id)}
                style={{
                  cursor: "pointer",
                  border: selectedConcept === c.concept_id
                    ? "2px solid #4d8b72"
                    : "1px solid rgba(21,51,40,0.09)",
                  transition: "border-color .2s ease",
                }}
                role="button"
                tabIndex={0}
                aria-pressed={selectedConcept === c.concept_id}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleConceptClick(c.concept_id);
                  }
                }}
              >
                <span style={{ color: "#4d8b72", font: '500 .7rem "DM Mono", monospace' }}>
                  {CONCEPT_NAMES[c.concept_id] || c.concept_id}
                </span>
                <h2 style={{ margin: ".5rem 0", fontSize: "1rem", color: "#17392c" }}>
                  Understanding Level: {(c.p_know * 100).toFixed(0)}%
                </h2>
                <MasteryBadge
                  pKnow={c.p_know}
                  band={c.band}
                  message={c.learner_message}
                  size="sm"
                />
                <p style={{ margin: ".6rem 0 0", color: "#6a8478", fontSize: ".8rem" }}>
                  {c.evidence_count} evidence points · {c.independent_correct_count} independent
                </p>
                {c.recent_error_tags.length > 0 && (
                  <p style={{ margin: ".3rem 0 0", color: "#b44", fontSize: ".75rem" }}>
                    Recent errors: {c.recent_error_tags.map(t => t.replace(/_/g, " ").replace(/\beq\.|num\./g, "")).join(", ")}
                  </p>
                )}
              </article>
            ))}
          </section>

          {/* Evidence timeline drill-down */}
          {selectedConcept !== null && (
            <section style={{ marginTop: "2.5rem" }} aria-label="Evidence timeline">
              <h2 style={{ color: "#17392c", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                Evidence timeline — {CONCEPT_NAMES[selectedConcept] || selectedConcept}
              </h2>
              {timeline.length === 0 ? (
                <p style={{ color: "#6a8478" }}>Loading timeline…</p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: ".6rem",
                    padding: 0,
                    margin: 0,
                  }}
                >
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
                          background: "linear-gradient(135deg, #e0f4e7, #fff0bf)",
                          color: "#285745",
                          font: '700 .7rem "DM Mono", monospace',
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
                          background: entry.p_know >= 0.7
                            ? "#4d8b72"
                            : entry.p_know >= 0.4
                              ? "#c5a600"
                              : "#b44",
                        }}
                      />
                      {/* Entry card */}
                      <div
                        style={{
                          padding: ".7rem .9rem",
                          borderRadius: ".7rem",
                          background: "#fff",
                          boxShadow: "0 6px 20px rgba(21,51,40,0.06)",
                          border: "1px solid rgba(21,51,40,0.08)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
                          <strong style={{ color: "#17392c", fontSize: ".9rem" }}>
                            {(entry.p_know * 100).toFixed(0)}%
                          </strong>
                          <MasteryBadge
                            pKnow={entry.p_know}
                            band={entry.band}
                            message={entry.learner_message}
                            size="sm"
                          />
                          {entry.hint_used && (
                            <span style={{
                              fontSize: ".7rem",
                              color: "#c5a600",
                              background: "rgba(197,166,0,0.1)",
                              padding: ".15rem .4rem",
                              borderRadius: ".3rem",
                            }}>
                              hint used
                            </span>
                          )}
                        </div>
                        <p style={{ margin: ".3rem 0 0", color: "#6a8478", fontSize: ".75rem" }}>
                          {entry.evidence_count} evidence · {entry.independent_correct_count} independent
                          {entry.recent_error_tags.length > 0
                            ? ` · Errors: ${entry.recent_error_tags.map(t => t.replace(/_/g, " ").replace(/\beq\.|num\./g, "")).join(", ")}`
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
