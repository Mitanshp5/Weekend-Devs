/**
 * TeacherDashboardPage — intervention-ready cohort analytics.
 *
 * Three panels:
 *   A. Cohort command center (band distribution + top clusters)
 *   B. Student intervention cards (drill-down)
 *   C. Misconception cluster view (class-wide patterns)
 *
 * Applies frontend-design skill: evidence-led design, restrained dashboard surfaces.
 * Applies vercel-react-best-practices: Promise.all for parallel fetches,
 * no inline component definitions, functional setState.
 */

import { useEffect, useState } from "react";
import { PageTransition } from "../components/PageTransition";
import { MasteryBadge } from "../components/MasteryBadge";
import {
  fetchCohort,
  fetchClusters,
  type CohortResponse,
  type ClusterData,
  type StudentCardData,
} from "../api/tutorAnalytics";
import { CONCEPT_NAMES } from "./TutorPage";

const BAND_LABELS: Record<string, string> = {
  foundational: "Foundational",
  needs_prerequisite_support: "Needs Support",
  developing: "Developing",
  ready_for_extension: "Ready for Extension",
};

const BAND_COLORS: Record<string, string> = {
  foundational: "#b44",
  needs_prerequisite_support: "#c2185b",
  developing: "#c5a600",
  ready_for_extension: "#1a5c3f",
};

export function TeacherDashboardPage() {
  const [cohort, setCohort] = useState<CohortResponse | null>(null);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchCohort(8), fetchClusters(8)])
      .then(([cohortData, clusterData]) => {
        setCohort(cohortData);
        setClusters(clusterData.clusters);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <PageTransition className="dashboard-page">
        <p className="eyebrow">Teacher dashboard</p>
        <h1>Loading…</h1>
      </PageTransition>
    );
  }

  if (error || !cohort) {
    return (
      <PageTransition className="dashboard-page">
        <p className="eyebrow">Teacher dashboard</p>
        <h1>Error</h1>
        <p className="page-copy">{error ?? "Failed to load cohort data."}</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="dashboard-page">
      <p className="eyebrow">Teacher dashboard</p>
      <h1>Intervention-ready&nbsp;insights</h1>
      <p className="page-copy">
        Which students need which intervention, based on what evidence, right now?
      </p>

      {/* Panel A: Cohort command center */}
      <section style={{ marginTop: "2rem" }} aria-label="Cohort command center">
        <h2 style={{ fontSize: "1rem", color: "#17392c", margin: "0 0 1rem" }}>
          Cohort overview — Grade {cohort.grade}
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {/* Band distribution cards */}
          {Object.entries(cohort.band_distribution).map(([band, count]) => (
            <div
              key={band}
              style={{
                flex: "1 1 140px",
                padding: ".9rem 1rem",
                borderRadius: ".8rem",
                background: "#fff",
                boxShadow: "0 8px 24px rgba(21,51,40,0.06)",
                border: "1px solid rgba(21,51,40,0.08)",
                textAlign: "center",
              }}
            >
              <span style={{
                display: "block",
                fontSize: "2rem",
                fontWeight: 800,
                color: BAND_COLORS[band] ?? "#555",
                lineHeight: 1.1,
              }}>
                {count}
              </span>
              <span style={{ color: "#6a8478", fontSize: ".75rem", fontWeight: 600 }}>
                {BAND_LABELS[band] ?? band}
              </span>
            </div>
          ))}
          <div
            style={{
              flex: "1 1 140px",
              padding: ".9rem 1rem",
              borderRadius: ".8rem",
              background: "linear-gradient(135deg, #e0f4e7, #fff0bf)",
              textAlign: "center",
              border: "1px solid rgba(21,51,40,0.08)",
            }}
          >
            <span style={{ display: "block", fontSize: "2rem", fontWeight: 800, color: "#285745", lineHeight: 1.1 }}>
              {cohort.total_learners}
            </span>
            <span style={{ color: "#4d8b72", fontSize: ".75rem", fontWeight: 600 }}>Total learners</span>
          </div>
        </div>
      </section>

      {/* Panel B: Intervention recommendations */}
      <section style={{ marginTop: "2rem" }} aria-label="Intervention recommendations">
        <h2 style={{ fontSize: "1rem", color: "#17392c", margin: "0 0 1rem" }}>
          Intervene now
        </h2>
        {cohort.intervention_recommendations.length === 0 ? (
          <p style={{ color: "#6a8478" }}>No urgent interventions at this time.</p>
        ) : (
          <div style={{ display: "grid", gap: ".7rem" }}>
            {cohort.intervention_recommendations.map((student: StudentCardData) => (
              <StudentInterventionCard key={student.learner_id} student={student} />
            ))}
          </div>
        )}
      </section>

      {/* Panel C: Misconception clusters */}
      <section style={{ marginTop: "2.5rem" }} aria-label="Misconception clusters">
        <h2 style={{ fontSize: "1rem", color: "#17392c", margin: "0 0 1rem" }}>
          Class misconception clusters
        </h2>
        <div style={{ display: "grid", gap: ".7rem" }}>
          {clusters.map((cluster) => (
            <ClusterCard key={`${cluster.error_tag}-${cluster.concept_id}`} cluster={cluster} />
          ))}
        </div>
      </section>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// Sub-components (not inline — following vercel best practices)
// ---------------------------------------------------------------------------

function StudentInterventionCard({ student }: { student: StudentCardData }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: "1rem",
        padding: "1rem 1.1rem",
        borderRadius: ".9rem",
        background: "#fff",
        boxShadow: "0 10px 28px rgba(21,51,40,0.05)",
        border: "1px solid rgba(21,51,40,0.09)",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".3rem" }}>
          <strong style={{ color: "#17392c", fontSize: ".95rem" }}>
            {student.learner_id}
          </strong>
          <MasteryBadge
            pKnow={student.blocker_confidence ?? 0}
            band={student.band}
            message={BAND_LABELS[student.band] ?? student.band}
            size="sm"
          />
        </div>
        {student.current_target_concept && (
          <p style={{ margin: ".2rem 0", color: "#4d8b72", fontSize: ".8rem" }}>
            Target: {CONCEPT_NAMES[student.current_target_concept] || student.current_target_concept}
            {student.current_path ? ` · ${student.current_path} path` : ""}
          </p>
        )}
        {student.likely_blocker_concept && (
          <p style={{ margin: ".2rem 0", color: "#b44", fontSize: ".8rem" }}>
            Likely blocker: {CONCEPT_NAMES[student.likely_blocker_concept] || student.likely_blocker_concept}
            {student.blocker_confidence !== null
              ? ` (${(student.blocker_confidence * 100).toFixed(0)}% confidence)`
              : ""}
          </p>
        )}
        {student.evidence_summary && (
          <p style={{ margin: ".2rem 0", color: "#6a8478", fontSize: ".78rem" }}>
            {student.evidence_summary}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".3rem" }}>
        {student.recommended_action && (
          <span style={{
            display: "inline-block",
            padding: ".3rem .6rem",
            borderRadius: ".4rem",
            background: "linear-gradient(135deg, #e0f4e7, #d0f5e4)",
            color: "#1a5c3f",
            fontSize: ".75rem",
            fontWeight: 600,
            maxWidth: "200px",
            textAlign: "right",
          }}>
            {student.recommended_action}
          </span>
        )}
        {student.pending_sync_count > 0 && (
          <span style={{
            fontSize: ".7rem",
            color: "#c5a600",
            background: "rgba(197,166,0,0.1)",
            padding: ".15rem .4rem",
            borderRadius: ".3rem",
          }}>
            {student.pending_sync_count} pending sync
          </span>
        )}
      </div>
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: ClusterData }) {
  const affectedPct = cluster.total_active > 0
    ? ((cluster.affected_count / cluster.total_active) * 100).toFixed(0)
    : "0";

  return (
    <div
      style={{
        padding: "1rem 1.1rem",
        borderRadius: ".9rem",
        background: "#fff",
        boxShadow: "0 10px 28px rgba(21,51,40,0.05)",
        border: "1px solid rgba(21,51,40,0.09)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
        <strong style={{ color: "#17392c", fontSize: ".95rem" }}>
          {cluster.error_tag.replace(/_/g, " ").replace(/\beq\.|num\./g, "")}
        </strong>
        <span style={{
          fontSize: ".72rem",
          color: "#b44",
          background: "rgba(180,68,68,0.08)",
          padding: ".15rem .5rem",
          borderRadius: ".3rem",
          fontWeight: 600,
        }}>
          {cluster.affected_count}/{cluster.total_active} learners ({affectedPct}%)
        </span>
        <span style={{
          fontSize: ".72rem",
          color: "#4d8b72",
          font: '500 .68rem "DM Mono", monospace',
        }}>
          impact: {(cluster.impact_score * 100).toFixed(0)}
        </span>
      </div>
      <p style={{ margin: ".4rem 0 0", color: "#6a8478", fontSize: ".8rem" }}>
        Concept: {CONCEPT_NAMES[cluster.concept_id] || cluster.concept_id}
        {cluster.trend_growth > 0
          ? ` · Trending ↑${(cluster.trend_growth * 100).toFixed(0)}%`
          : ""}
      </p>
      {cluster.suggested_intervention && (
        <p style={{
          margin: ".5rem 0 0",
          padding: ".5rem .7rem",
          borderRadius: ".5rem",
          background: "linear-gradient(135deg, #f9fdf9, #e5f6ec)",
          color: "#1a5c3f",
          fontSize: ".8rem",
          lineHeight: 1.5,
          border: "1px solid rgba(26,92,63,0.1)",
        }}>
          💡 {cluster.suggested_intervention}
        </p>
      )}
    </div>
  );
}
