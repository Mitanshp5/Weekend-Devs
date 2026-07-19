"""PostgreSQL-backed curriculum catalog for the PRISM prototype."""

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

from app.curriculum import CURRICULUM_SOURCES, CURRICULUM_UNITS, SOURCE_FOR_SUBJECT

ROOT_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ROOT_ENV_FILE)

SEED_SUBJECTS = (
    (8, "mathematics", "Mathematics"),
    (8, "science", "Science"),
    (8, "english", "English"),
)


def database_url() -> str:
    return os.environ["PRISM_DATABASE_URL"]


def connect() -> psycopg.Connection:
    return psycopg.connect(database_url(), row_factory=dict_row)


def initialize_database() -> None:
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS curriculum_sources (
                    slug TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    url TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS subjects (
                    id BIGSERIAL PRIMARY KEY,
                    grade INTEGER NOT NULL,
                    slug TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS units (
                    id BIGSERIAL PRIMARY KEY,
                    grade INTEGER NOT NULL,
                    subject_slug TEXT NOT NULL,
                    slug TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    source_slug TEXT
                );
                ALTER TABLE units ADD COLUMN IF NOT EXISTS source_slug TEXT;
                CREATE TABLE IF NOT EXISTS concepts (
                    id BIGSERIAL PRIMARY KEY,
                    unit_slug TEXT NOT NULL,
                    slug TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    position INTEGER NOT NULL
                );

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
            cursor.executemany(
                """
                INSERT INTO curriculum_sources (slug, title, url) VALUES (%s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
                """,
                CURRICULUM_SOURCES,
            )
            cursor.executemany(
                """
                INSERT INTO subjects (grade, slug, name) VALUES (%s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET grade = EXCLUDED.grade, name = EXCLUDED.name
                """,
                SEED_SUBJECTS,
            )
            cursor.executemany(
                """
                INSERT INTO units (grade, subject_slug, slug, name, position, source_slug)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    position = EXCLUDED.position,
                    source_slug = EXCLUDED.source_slug
                """,
                [
                    (8, subject_slug, unit_slug, name, position, SOURCE_FOR_SUBJECT[subject_slug])
                    for subject_slug, unit_slug, name, position, _ in CURRICULUM_UNITS
                ],
            )
            seed_unit_slugs = [unit_slug for _, unit_slug, _, _, _ in CURRICULUM_UNITS]
            cursor.execute(
                "DELETE FROM units WHERE grade = %s AND NOT (slug = ANY(%s))",
                (8, seed_unit_slugs),
            )
            cursor.execute("DELETE FROM concepts WHERE unit_slug NOT IN (SELECT slug FROM units)")
            cursor.executemany(
                """
                INSERT INTO concepts (unit_slug, slug, name, description, position)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    position = EXCLUDED.position
                """,
                [
                    (unit_slug, f"{unit_slug}-{position}", concept, f"Build confidence with {concept.lower()}.", position)
                    for _, unit_slug, _, _, concepts in CURRICULUM_UNITS
                    for position, concept in enumerate(concepts, start=1)
                ],
            )


def subjects_for_grade(grade: int) -> list[dict[str, str | int]]:
    initialize_database()
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT subjects.slug, subjects.name, COUNT(units.id) AS unit_count
                FROM subjects
                LEFT JOIN units ON units.subject_slug = subjects.slug AND units.grade = subjects.grade
                WHERE subjects.grade = %s
                GROUP BY subjects.id
                ORDER BY subjects.id
                """,
                (grade,),
            )
            return list(cursor.fetchall())


def units_for_subject(grade: int, subject_slug: str) -> dict[str, object] | None:
    initialize_database()
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT slug, name FROM subjects WHERE grade = %s AND slug = %s",
                (grade, subject_slug),
            )
            subject = cursor.fetchone()
            if subject is None:
                return None
            cursor.execute(
                """
                SELECT units.slug, units.name, units.position, COUNT(concepts.id) AS concept_count
                FROM units
                LEFT JOIN concepts ON concepts.unit_slug = units.slug
                WHERE units.grade = %s AND units.subject_slug = %s
                GROUP BY units.id
                ORDER BY units.position
                """,
                (grade, subject_slug),
            )
            return {"subject": subject, "units": list(cursor.fetchall())}


def concepts_for_unit(unit_slug: str) -> list[dict[str, str | int]] | None:
    initialize_database()
    with connect() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT slug FROM units WHERE slug = %s", (unit_slug,))
            if cursor.fetchone() is None:
                return None
            cursor.execute(
                """
                SELECT slug, name, description, position
                FROM concepts
                WHERE unit_slug = %s
                ORDER BY position
                """,
                (unit_slug,),
            )
            return list(cursor.fetchall())


# ===========================================================================
# TUTOR ANALYTICS DUMMY SEED DATA & HELPERS
# ===========================================================================
# The following variables and functions contain synthetic/dummy database values
# and seed scripts constructed specifically for demonstrating the dashboard, BKT,
# and Socratic tutor features in the Tutor Analytics module.
# ===========================================================================

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


def seed_tutor_analytics_data(force: bool = False) -> None:
    """Populate Tutor Analytics tables with synthetic demo data (idempotent)."""
    initialize_database()
    with connect() as connection:
        with connection.cursor() as cursor:
            if force:
                cursor.execute(
                    "TRUNCATE TABLE teacher_summaries, mastery_history, misconception_clusters, tutor_sessions;"
                )
            else:
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

