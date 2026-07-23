/**
 * TeacherDashboardPage — Magoosh-inspired intervention-ready cohort analytics.
 *
 * Three panels:
 *   A. Cohort command center — stat cards with band distribution
 *   B. Student intervention cards — clean white cards with action buttons
 *   C. Misconception cluster view — impact bars with purple theme
 */

import { useEffect, useState } from "react";
import { PageTransition } from "../components/PageTransition";
import { DonutChart } from "../components/DonutChart";
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
  foundational: "#d63031",
  needs_prerequisite_support: "#e67e22",
  developing: "#f39c12",
  ready_for_extension: "#1bb576",
};

const BAND_PILL: Record<string, string> = {
  foundational: "mg-pill--red",
  needs_prerequisite_support: "mg-pill--orange",
  developing: "mg-pill--orange",
  ready_for_extension: "mg-pill--green",
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
      <PageTransition className="dashboard-page mg-page">
        <div className="mg-breadcrumb">
          <a href="/learn">Home</a><span>›</span><span>Teacher Dashboard</span>
        </div>
        <h1 style={{ maxWidth: "20ch", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Loading…</h1>
      </PageTransition>
    );
  }

  if (error || !cohort) {
    return (
      <PageTransition className="dashboard-page mg-page">
        <div className="mg-breadcrumb">
          <a href="/learn">Home</a><span>›</span><span>Teacher Dashboard</span>
        </div>
        <h1 style={{ maxWidth: "20ch", fontSize: "clamp(2rem, 4vw, 3rem)" }}>Error</h1>
        <p style={{ color: "#636e72" }}>{error ?? "Failed to load cohort data."}</p>
      </PageTransition>
    );
  }

  const needingIntervention = cohort.intervention_recommendations.length;
  const totalBands = Object.values(cohort.band_distribution).reduce((a, b) => a + b, 0);
  const avgMastery = totalBands > 0
    ? Math.round(
        ((cohort.band_distribution["ready_for_extension"] ?? 0) / totalBands) * 100
      )
    : 0;

  return (
    <PageTransition className="dashboard-page mg-page">
      {/* Breadcrumb */}
      <div className="mg-breadcrumb">
        <a href="/learn">Home</a>
        <span>›</span>
        <span>Teacher Dashboard</span>
      </div>

      <h1 style={{ maxWidth: "20ch", fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        Teacher Dashboard
      </h1>
      <p className="page-copy">
        Which students need which intervention, based on what evidence, right now?
      </p>

      {/* Top summary stats */}
      <div className="mg-stat-grid">
        <div className="mg-stat-card">
          <div className="mg-stat-card__title">Total Learners</div>
          <div className="mg-stat-card__value">{cohort.total_learners}</div>
          <div className="mg-stat-card__sub">Grade {cohort.grade}</div>
        </div>
        <div className="mg-stat-card">
          <div className="mg-stat-card__title">Class Mastery</div>
          <div className="mg-donut-wrap">
            <DonutChart
              value={avgMastery}
              size={80}
              strokeWidth={7}
              color="#1bb576"
              label={`${avgMastery}%`}
              labelSize={16}
            />
          </div>
          <div className="mg-stat-card__sub">Extension-ready</div>
        </div>
        <div className="mg-stat-card">
          <div className="mg-stat-card__title">Need Intervention</div>
          <div className="mg-stat-card__value" style={{ color: needingIntervention > 0 ? "#d63031" : "#1bb576" }}>
            {needingIntervention}
          </div>
          <div className="mg-stat-card__sub">Students</div>
        </div>
        <div className="mg-stat-card">
          <div className="mg-stat-card__title">Misconceptions</div>
          <div className="mg-stat-card__value" style={{ color: "#553285" }}>
            {clusters.length}
          </div>
          <div className="mg-stat-card__sub">Active clusters</div>
        </div>
      </div>

      {/* Panel A: Band distribution */}
      <section style={{ marginTop: "2.5rem" }} aria-label="Cohort command center">
        <h2 className="mg-section-title">
          Cohort Overview — Grade {cohort.grade}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {Object.entries(cohort.band_distribution).map(([band, count]) => (
            <div
              key={band}
              className="mg-card"
              style={{
                textAlign: "center",
                borderLeft: `4px solid ${BAND_COLORS[band] ?? "#636e72"}`,
                padding: "1.2rem",
              }}
            >
              <span style={{
                display: "block",
                fontSize: "2.2rem",
                fontWeight: 800,
                color: BAND_COLORS[band] ?? "#636e72",
                lineHeight: 1.1,
                fontFamily: '"Inter", sans-serif',
              }}>
                {count}
              </span>
              <span style={{ color: "#636e72", fontSize: ".78rem", fontWeight: 600, fontFamily: '"Inter", sans-serif' }}>
                {BAND_LABELS[band] ?? band}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Panel B: Intervention recommendations */}
      <section style={{ marginTop: "2.5rem" }} aria-label="Intervention recommendations">
        <h2 className="mg-section-title">
          Intervene Now
        </h2>
        {cohort.intervention_recommendations.length === 0 ? (
          <p style={{ color: "#636e72" }}>No urgent interventions at this time.</p>
        ) : (
          <div style={{ display: "grid", gap: ".8rem" }}>
            {cohort.intervention_recommendations.map((student: StudentCardData) => (
              <StudentInterventionCard key={student.learner_id} student={student} />
            ))}
          </div>
        )}
      </section>

      {/* Panel C: Misconception clusters */}
      <section style={{ marginTop: "2.5rem" }} aria-label="Misconception clusters">
        <h2 className="mg-section-title">
          Class Misconception Clusters
        </h2>
        <div style={{ display: "grid", gap: ".8rem" }}>
          {clusters.map((cluster) => (
            <ClusterCard key={`${cluster.error_tag}-${cluster.concept_id}`} cluster={cluster} />
          ))}
        </div>
      </section>
    </PageTransition>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StudentInterventionCard({ student }: { student: StudentCardData }) {
  return (
    <div className="mg-intervention-card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        borderRadius: "4px 0 0 4px",
        background: BAND_COLORS[student.band] ?? "#636e72",
      }} />
      <div style={{ paddingLeft: ".8rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".3rem" }}>
          <strong style={{ color: "#2d3436", fontSize: ".95rem", fontFamily: '"Inter", sans-serif' }}>
            {student.learner_id}
          </strong>
          <span className={`mg-pill ${BAND_PILL[student.band] ?? "mg-pill--purple"}`}>
            {BAND_LABELS[student.band] ?? student.band}
          </span>
        </div>
        {student.current_target_concept && (
          <p style={{ margin: ".2rem 0", color: "#553285", fontSize: ".82rem", fontFamily: '"Inter", sans-serif' }}>
            Target: {CONCEPT_NAMES[student.current_target_concept] || student.current_target_concept}
            {student.current_path ? ` · ${student.current_path} path` : ""}
          </p>
        )}
        {student.likely_blocker_concept && (
          <p style={{ margin: ".2rem 0", color: "#d63031", fontSize: ".82rem", fontFamily: '"Inter", sans-serif' }}>
            Likely blocker: {CONCEPT_NAMES[student.likely_blocker_concept] || student.likely_blocker_concept}
            {student.blocker_confidence !== null
              ? ` (${(student.blocker_confidence * 100).toFixed(0)}% confidence)`
              : ""}
          </p>
        )}
        {student.evidence_summary && (
          <p style={{ margin: ".2rem 0", color: "#636e72", fontSize: ".78rem", fontFamily: '"Inter", sans-serif' }}>
            {student.evidence_summary}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".4rem" }}>
        {student.recommended_action && (
          <button className="mg-btn mg-btn--primary" style={{ fontSize: ".75rem", padding: ".35rem .7rem" }}>
            {student.recommended_action}
          </button>
        )}
        {student.pending_sync_count > 0 && (
          <span className="mg-pill mg-pill--orange">
            {student.pending_sync_count} pending sync
          </span>
        )}
      </div>
    </div>
  );
}

const ERROR_TAG_FRIENDLY: Record<string, string> = {
  "eq.sign_not_transferred": "Sign not transferred correctly",
  "num.subtraction_confusion": "Confusion between addition and subtraction",
  "eq.added_instead_of_subtracted": "Added instead of subtracted",
  "eq.stops_before_division": "Stops before final division step",
  "eq.stops_before_adding": "Stops before adding back",
  "eq.wrong_distribution": "Incorrect distribution",
  "eq.wrong_variable_assignment": "Wrong variable assignment",
};

function ClusterCard({ cluster }: { cluster: ClusterData }) {
  const affectedPct = cluster.total_active > 0
    ? Math.round((cluster.affected_count / cluster.total_active) * 100)
    : 0;
  const impactPct = Math.round(cluster.impact_score * 100);
  const friendlyTag = ERROR_TAG_FRIENDLY[cluster.error_tag]
    || cluster.error_tag.replace(/_/g, " ").replace(/\beq\.|num\.|sci\.|eng\./g, "");

  return (
    <div className="mg-card">
      <div style={{ display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
        <strong style={{ color: "#2d3436", fontSize: ".95rem", fontFamily: '"Inter", sans-serif' }}>
          {friendlyTag}
        </strong>
        <span className="mg-pill mg-pill--red">
          {cluster.affected_count}/{cluster.total_active} learners ({affectedPct}%)
        </span>
      </div>
      <p style={{ margin: ".3rem 0", color: "#636e72", fontSize: ".82rem", fontFamily: '"Inter", sans-serif' }}>
        Concept: {CONCEPT_NAMES[cluster.concept_id] || cluster.concept_id}
        {cluster.trend_growth > 0
          ? ` · Trending ↑${(cluster.trend_growth * 100).toFixed(0)}%`
          : ""}
      </p>

      {/* Impact bar */}
      <div className="mg-impact-bar">
        <span style={{ fontSize: ".75rem", color: "#636e72", fontFamily: '"Inter", sans-serif' }}>Impact</span>
        <div className="mg-impact-track" style={{ maxWidth: 200 }}>
          <div className="mg-impact-fill" style={{ width: `${Math.max(impactPct, 5)}%` }} />
        </div>
        <span className="mg-impact-value">{impactPct}%</span>
      </div>

      {cluster.suggested_intervention && (
        <div style={{
          marginTop: ".6rem",
          padding: ".6rem .8rem",
          borderRadius: "8px",
          background: "rgba(27, 181, 118, 0.06)",
          color: "#158f5e",
          fontSize: ".82rem",
          fontFamily: '"Inter", sans-serif',
          lineHeight: 1.5,
          border: "1px solid rgba(27, 181, 118, 0.15)",
        }}>
          💡 {cluster.suggested_intervention}
        </div>
      )}
    </div>
  );
}
