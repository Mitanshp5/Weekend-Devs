"""Person 3 database tables and seed helpers for PRISM.

Creates tables for tutor sessions, mastery history, teacher summaries,
and misconception clusters. Designed to co-exist alongside the existing
curriculum/catalog tables without modifying them.
"""

from __future__ import annotations

from app.database import connect, initialize_database


def initialize_person3_tables() -> None:
    """Create Person 3 tables if they do not exist (idempotent)."""
    initialize_database()  # ensure base tables exist first
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS tutor_sessions (
                    id BIGSERIAL PRIMARY KEY,
                    learner_id TEXT NOT NULL,
                    question_id TEXT NOT NULL,
                    attempt_number INTEGER NOT NULL DEFAULT 0,
                    response_mode TEXT NOT NULL,
                    message TEXT NOT NULL,
                    concept_ids TEXT[] NOT NULL DEFAULT '{}',
                    citation_ids TEXT[] NOT NULL DEFAULT '{}',
                    confidence TEXT NOT NULL DEFAULT 'medium',
                    next_action TEXT NOT NULL DEFAULT 'await_learner_attempt',
                    is_fallback BOOLEAN NOT NULL DEFAULT false,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );

                CREATE TABLE IF NOT EXISTS mastery_history (
                    id BIGSERIAL PRIMARY KEY,
                    learner_id TEXT NOT NULL,
                    concept_id TEXT NOT NULL,
                    p_know FLOAT NOT NULL,
                    evidence_count INTEGER NOT NULL DEFAULT 0,
                    independent_correct_count INTEGER NOT NULL DEFAULT 0,
                    recent_error_tags TEXT[] NOT NULL DEFAULT '{}',
                    uncertainty TEXT NOT NULL DEFAULT 'high',
                    hint_used BOOLEAN NOT NULL DEFAULT false,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );

                CREATE TABLE IF NOT EXISTS teacher_summaries (
                    id BIGSERIAL PRIMARY KEY,
                    learner_id TEXT NOT NULL,
                    grade INTEGER NOT NULL,
                    band TEXT NOT NULL DEFAULT 'developing',
                    current_path TEXT,
                    current_target_concept TEXT,
                    likely_blocker_concept TEXT,
                    blocker_confidence FLOAT,
                    evidence_summary TEXT,
                    recommended_action TEXT,
                    pending_sync_count INTEGER NOT NULL DEFAULT 0,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );

                CREATE TABLE IF NOT EXISTS misconception_clusters (
                    id BIGSERIAL PRIMARY KEY,
                    grade INTEGER NOT NULL,
                    error_tag TEXT NOT NULL,
                    concept_id TEXT NOT NULL,
                    affected_count INTEGER NOT NULL DEFAULT 0,
                    total_active INTEGER NOT NULL DEFAULT 0,
                    recent_incorrect_rate FLOAT NOT NULL DEFAULT 0,
                    repeat_error_rate FLOAT NOT NULL DEFAULT 0,
                    trend_growth FLOAT NOT NULL DEFAULT 0,
                    impact_score FLOAT NOT NULL DEFAULT 0,
                    suggested_intervention TEXT,
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );

                CREATE INDEX IF NOT EXISTS idx_mastery_history_learner
                    ON mastery_history (learner_id);
                CREATE INDEX IF NOT EXISTS idx_mastery_history_concept
                    ON mastery_history (learner_id, concept_id);
                CREATE INDEX IF NOT EXISTS idx_tutor_sessions_learner
                    ON tutor_sessions (learner_id, question_id);
                CREATE INDEX IF NOT EXISTS idx_teacher_summaries_grade
                    ON teacher_summaries (grade);
                CREATE INDEX IF NOT EXISTS idx_clusters_grade
                    ON misconception_clusters (grade);
                """
            )


# ---------------------------------------------------------------------------
# Seed data helpers
# ---------------------------------------------------------------------------

SAMPLE_LEARNERS = [
    ("student-01", 8, "foundational", "Grade-Level", "eq.inverse_operations",
     "num.signed_operations", 0.72, "3 recent attempts show sign errors",
     "2-minute signed-number review card", 0),
    ("student-02", 8, "developing", "Grade-Level", "eq.multi_step",
     "eq.inverse_operations", 0.78, "Stops after isolating constant",
     "2-minute inverse-operation mini-whiteboard check", 1),
    ("student-03", 8, "developing", "Grade-Level", "eq.multi_step",
     None, None, None, None, 0),
    ("student-04", 8, "ready_for_extension", "Advanced", "eq.word_translation",
     None, None, None, None, 0),
    ("student-05", 8, "needs_prerequisite_support", "Foundational", "num.signed_operations",
     "num.mul_div_fluency", 0.85, "Consistent division errors",
     "Multiplication/division fluency drill", 0),
]

SAMPLE_MASTERY = [
    ("student-01", "num.signed_operations", 0.35, 5, 1, ["eq.sign_not_transferred"], "medium", False),
    ("student-01", "eq.inverse_operations", 0.48, 3, 1, ["eq.stops_before_division"], "medium", False),
    ("student-01", "num.signed_operations", 0.42, 6, 2, [], "medium", False),
    ("student-02", "eq.inverse_operations", 0.31, 4, 1, ["eq.stops_before_division"], "medium", False),
    ("student-02", "eq.inverse_operations", 0.45, 5, 2, ["eq.stops_before_division"], "medium", False),
    ("student-02", "eq.multi_step", 0.55, 3, 1, [], "high", False),
    ("student-03", "eq.inverse_operations", 0.72, 6, 3, [], "low", False),
    ("student-03", "eq.multi_step", 0.58, 4, 2, [], "medium", False),
    ("student-04", "eq.inverse_operations", 0.88, 8, 5, [], "low", False),
    ("student-04", "eq.multi_step", 0.82, 7, 4, [], "low", False),
    ("student-04", "eq.word_translation", 0.45, 3, 1, ["eq.sign_not_transferred"], "high", True),
    ("student-05", "num.mul_div_fluency", 0.28, 4, 0, ["num.division_error"], "high", True),
    ("student-05", "num.signed_operations", 0.32, 3, 0, ["eq.sign_not_transferred"], "high", False),
]

SAMPLE_CLUSTERS = [
    (8, "eq.stops_before_division", "eq.inverse_operations", 9, 24, 0.38, 0.25, 0.18, 0.0,
     "Ask the class: in 3x = 21, is x alone yet? What operation reverses ×3?"),
    (8, "eq.sign_not_transferred", "eq.inverse_operations", 5, 24, 0.21, 0.12, 0.05, 0.0,
     "Show the balance model: what happens to the sign when you move a term?"),
    (8, "num.division_error", "num.mul_div_fluency", 3, 24, 0.13, 0.08, 0.02, 0.0,
     "Quick 1-minute division fluency drill with the class."),
]


def _compute_cluster_impact(
    affected: int, total: int,
    recent_incorrect: float, repeat_error: float,
    trend: float,
) -> float:
    """Compute weighted impact score per the spec formula."""
    if total == 0:
        return 0.0
    return round(
        0.42 * (affected / total)
        + 0.22 * recent_incorrect
        + 0.18 * repeat_error
        + 0.10 * 0.5  # downstream_dependency_risk placeholder
        + 0.08 * trend,
        4,
    )


def seed_person3_data() -> None:
    """Populate Person 3 tables with synthetic demo data (idempotent)."""
    initialize_person3_tables()
    with connect() as connection:
        with connection.cursor() as cursor:
            # Avoid duplicate seeding
            cursor.execute("SELECT count(*) AS cnt FROM teacher_summaries")
            if cursor.fetchone()["cnt"] > 0:
                return

            for row in SAMPLE_LEARNERS:
                cursor.execute(
                    """
                    INSERT INTO teacher_summaries
                        (learner_id, grade, band, current_path, current_target_concept,
                         likely_blocker_concept, blocker_confidence, evidence_summary,
                         recommended_action, pending_sync_count)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    row,
                )

            for row in SAMPLE_MASTERY:
                learner_id, concept_id, p_know, ev, indep, tags, unc, hint = row
                cursor.execute(
                    """
                    INSERT INTO mastery_history
                        (learner_id, concept_id, p_know, evidence_count,
                         independent_correct_count, recent_error_tags, uncertainty, hint_used)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (learner_id, concept_id, p_know, ev, indep, tags, unc, hint),
                )

            for row in SAMPLE_CLUSTERS:
                grade, tag, concept, affected, total, recent, repeat, trend, _, intervention = row
                impact = _compute_cluster_impact(affected, total, recent, repeat, trend)
                cursor.execute(
                    """
                    INSERT INTO misconception_clusters
                        (grade, error_tag, concept_id, affected_count, total_active,
                         recent_incorrect_rate, repeat_error_rate, trend_growth,
                         impact_score, suggested_intervention)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (grade, tag, concept, affected, total, recent, repeat, trend,
                     impact, intervention),
                )
