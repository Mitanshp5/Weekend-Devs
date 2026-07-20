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

# Prototype data is persisted in PostgreSQL on first initialization so every
# route reads database records rather than frontend-local sample values.
ANALYTICS_LEARNERS = (
    ("student-01", 8, "foundational", "Grade-Level", "eq.inverse_operations", "num.signed_operations", .72, "Recent attempts show sign errors.", "Review signed-number operations."),
    ("student-02", 8, "developing", "Grade-Level", "eq.multi_step", "eq.inverse_operations", .78, "Stops after isolating the constant.", "Practice inverse operations."),
    ("student-03", 8, "developing", "Grade-Level", "eq.multi_step", None, None, None, None),
    ("student-04", 8, "ready_for_extension", "Advanced", "eq.word_translation", None, None, None, None),
    ("student-05", 8, "needs_prerequisite_support", "Foundational", "num.signed_operations", "num.mul_div_fluency", .85, "Consistent division errors.", "Practice multiplication and division fluency."),
)
ANALYTICS_MASTERY = (
    ("student-01", "num.signed_operations", .42, 6, 2, [], "medium", False),
    ("student-01", "eq.inverse_operations", .48, 3, 1, ["eq.stops_before_division"], "medium", False),
    ("student-02", "eq.inverse_operations", .31, 4, 1, ["eq.stops_before_division"], "medium", False),
    ("student-02", "eq.inverse_operations", .45, 5, 2, ["eq.stops_before_division"], "medium", False),
    ("student-02", "eq.multi_step", .55, 3, 1, [], "high", False),
    ("student-03", "eq.inverse_operations", .72, 6, 3, [], "low", False),
    ("student-04", "eq.inverse_operations", .88, 8, 5, [], "low", False),
    ("student-04", "eq.multi_step", .82, 7, 4, [], "low", False),
    ("student-05", "num.mul_div_fluency", .28, 4, 0, ["num.division_error"], "high", True),
)
ANALYTICS_CLUSTERS = (
    (8, "eq.stops_before_division", "eq.inverse_operations", 9, 24, .38, .25, .18, .3671, "Ask which inverse operation isolates the variable."),
    (8, "eq.sign_not_transferred", "eq.inverse_operations", 5, 24, .21, .12, .05, .2307, "Use a balance model to discuss signs."),
    (8, "num.division_error", "num.mul_div_fluency", 3, 24, .13, .08, .02, .1486, "Run a short division-fluency check."),
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

                CREATE TABLE IF NOT EXISTS tutor_questions (
                    id TEXT PRIMARY KEY,
                    concept_id TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    answer_type TEXT NOT NULL,
                    expected_answer TEXT NOT NULL,
                    difficulty FLOAT NOT NULL,
                    solution_steps JSONB NOT NULL DEFAULT '[]',
                    rubric JSONB NOT NULL DEFAULT '[]',
                    hint_ladder JSONB NOT NULL DEFAULT '[]',
                    feedback JSONB NOT NULL DEFAULT '{}'
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
            cursor.execute("SELECT EXISTS (SELECT 1 FROM teacher_summaries) AS has_analytics")
            if not cursor.fetchone()["has_analytics"]:
                cursor.executemany(
                    """INSERT INTO teacher_summaries
                    (learner_id, grade, band, current_path, current_target_concept,
                     likely_blocker_concept, blocker_confidence, evidence_summary, recommended_action)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    ANALYTICS_LEARNERS,
                )
                cursor.executemany(
                    """INSERT INTO mastery_history
                    (learner_id, concept_id, p_know, evidence_count, independent_correct_count,
                     recent_error_tags, uncertainty, hint_used)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    ANALYTICS_MASTERY,
                )
                cursor.executemany(
                    """INSERT INTO misconception_clusters
                    (grade, error_tag, concept_id, affected_count, total_active,
                     recent_incorrect_rate, repeat_error_rate, trend_growth, impact_score, suggested_intervention)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    ANALYTICS_CLUSTERS,
                )


def subjects_for_grade(grade: int) -> list[dict[str, str | int]]:
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
