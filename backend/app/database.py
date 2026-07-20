"""PostgreSQL-backed curriculum catalog for the PRISM prototype."""

import os
from pathlib import Path

import bcrypt
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

# Demo learner definitions — single source of truth for all seed data
_DEMO_LEARNERS = [
    {
        "name": "Aanya Sharma",
        "email": "aanya@prism.demo",
        "password": "Prism_demo_1",
        "band": "developing",
        "description": "Grade-level learner, consistent performer",
        "mastery": [
            ("eq.inverse_operations", 0.61, 6, 2),
            ("num.signed_operations", 0.55, 4, 1),
            ("math.rational_numbers", 0.48, 3, 0),
        ],
    },
    {
        "name": "Ravi Kumar",
        "email": "ravi@prism.demo",
        "password": "Prism_demo_2",
        "band": "foundational",
        "description": "Foundational learner, needs prerequisite support",
        "mastery": [
            ("eq.inverse_operations", 0.22, 4, 0),
            ("num.signed_operations", 0.18, 5, 0),
            ("sci.crop_production", 0.31, 3, 0),
        ],
    },
    {
        "name": "Priya Patel",
        "email": "priya@prism.demo",
        "password": "Prism_demo_3",
        "band": "ready_for_extension",
        "description": "Advanced learner, quick mastery",
        "mastery": [
            ("eq.inverse_operations", 0.91, 8, 6),
            ("eq.multi_step", 0.87, 7, 5),
            ("math.quadrilaterals", 0.78, 6, 4),
            ("sci.microorganisms", 0.82, 5, 4),
        ],
    },
    {
        "name": "Arjun Singh",
        "email": "arjun@prism.demo",
        "password": "Prism_demo_4",
        "band": "developing",
        "description": "Developing learner, improving steadily",
        "mastery": [
            ("eq.inverse_operations", 0.54, 5, 2),
            ("eq.word_translation", 0.42, 4, 1),
            ("math.linear_equations", 0.38, 3, 0),
        ],
    },
    {
        "name": "Meera Iyer",
        "email": "meera@prism.demo",
        "password": "Prism_demo_5",
        "band": "developing",
        "description": "Grade-level learner, strong in Science",
        "mastery": [
            ("sci.crop_production", 0.76, 6, 4),
            ("sci.microorganisms", 0.71, 5, 3),
            ("eq.inverse_operations", 0.44, 3, 1),
        ],
    },
    {
        "name": "Kabir Das",
        "email": "kabir@prism.demo",
        "password": "Prism_demo_6",
        "band": "needs_prerequisite_support",
        "description": "Foundational learner, struggles with word problems",
        "mastery": [
            ("eq.word_translation", 0.15, 6, 0),
            ("eq.multi_step", 0.20, 5, 0),
            ("num.signed_operations", 0.28, 4, 0),
        ],
    },
    {
        "name": "Nisha Reddy",
        "email": "nisha@prism.demo",
        "password": "Prism_demo_7",
        "band": "ready_for_extension",
        "description": "Advanced learner, excels in English",
        "mastery": [
            ("eng.tsunami", 0.93, 7, 6),
            ("eng.christmas_present", 0.88, 6, 5),
            ("sci.conservation", 0.74, 5, 3),
        ],
    },
    {
        "name": "Vikram Joshi",
        "email": "vikram@prism.demo",
        "password": "Prism_demo_8",
        "band": "developing",
        "description": "Developing learner, inconsistent performance",
        "mastery": [
            ("eq.inverse_operations", 0.38, 5, 1),
            ("num.mul_div_fluency", 0.45, 4, 1),
            ("math.data_handling", 0.29, 3, 0),
        ],
    },
]


def database_url() -> str:
    return os.environ["PRISM_DATABASE_URL"]


def connect() -> psycopg.Connection:
    return psycopg.connect(database_url(), row_factory=dict_row)


def _seed_demo_data(cursor: psycopg.Cursor) -> None:
    """Idempotently seed all demo learner accounts, mastery snapshots, teacher summaries,
    and misconception clusters. Called once from initialize_database()."""
    seed_emails = [l["email"] for l in _DEMO_LEARNERS]

    # Clear stale analytics for demo accounts (preserves real user data)
    cursor.execute("DELETE FROM mastery_history WHERE learner_id = ANY(%s)", (seed_emails,))
    cursor.execute("DELETE FROM teacher_summaries WHERE learner_id = ANY(%s)", (seed_emails,))
    cursor.execute("DELETE FROM tutor_sessions WHERE learner_id = ANY(%s)", (seed_emails,))
    cursor.execute("DELETE FROM misconception_clusters WHERE grade = 8")

    for learner in _DEMO_LEARNERS:
        email = learner["email"]
        pw_hash = bcrypt.hashpw(
            learner["password"].encode("utf-8"), bcrypt.gensalt(rounds=10)
        ).decode("utf-8")

        # Upsert auth_users with description column
        cursor.execute(
            """
            INSERT INTO auth_users (username, email, password, role, is_verified, description)
            VALUES (%s, %s, %s, 'student', true, %s)
            ON CONFLICT (email) DO UPDATE
                SET username = EXCLUDED.username,
                    password = EXCLUDED.password,
                    role = 'student',
                    is_verified = true,
                    description = EXCLUDED.description,
                    updated_at = now()
            """,
            (learner["name"], email, pw_hash, learner["description"]),
        )

        # Two mastery snapshots per concept to show growth trajectory
        for concept_id, p_know, evidence_count, independent_correct in learner["mastery"]:
            initial_p = max(0.05, p_know - 0.15)
            cursor.execute(
                """
                INSERT INTO mastery_history
                    (learner_id, concept_id, p_know, evidence_count, independent_correct_count)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (email, concept_id, initial_p, max(1, evidence_count - 2), max(0, independent_correct - 1)),
            )
            cursor.execute(
                """
                INSERT INTO mastery_history
                    (learner_id, concept_id, p_know, evidence_count, independent_correct_count)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (email, concept_id, p_know, evidence_count, independent_correct),
            )

        # Teacher summary
        top_concept = learner["mastery"][0][0] if learner["mastery"] else "eq.inverse_operations"
        cursor.execute(
            """
            INSERT INTO teacher_summaries
                (learner_id, grade, band, current_path, current_target_concept,
                 likely_blocker_concept, blocker_confidence, evidence_summary,
                 recommended_action)
            VALUES (%s, 8, %s, 'Grade-Level', %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (
                email, learner["band"], top_concept, top_concept, 0.78,
                learner["description"],
                "Review concept fundamentals and practice with guided hints.",
            ),
        )

    # Seed misconception clusters
    cluster_data = [
        (8, "eq.inverse_operations", "inverse_op_sign_error", 5, 12, 0.41, 0.33, 0.12, 0.87,
         "Use number lines to model inverse operations before introducing symbolic manipulation."),
        (8, "eq.word_translation", "word_to_equation_gap", 4, 12, 0.33, 0.50, 0.08, 0.79,
         "Provide sentence-to-equation translation scaffolding before independent practice."),
        (8, "num.signed_operations", "sign_confusion", 3, 12, 0.25, 0.67, 0.05, 0.71,
         "Use integer chip models before moving to abstract rules."),
    ]
    for row in cluster_data:
        cursor.execute(
            """
            INSERT INTO misconception_clusters
                (grade, concept_id, error_tag, affected_count, total_active,
                 recent_incorrect_rate, repeat_error_rate, trend_growth, impact_score,
                 suggested_intervention)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            row,
        )


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

        try:
            # Ensure auth_users has a description column (managed by FlowWatch)
            cursor.execute(
                "ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS description TEXT"
            )
            # Seed all demo learner data idempotently
            _seed_demo_data(cursor)
        except Exception:
            # auth_users doesn't exist yet (e.g. FlowWatch not initialised or test DB).
            # Seeding will succeed on next startup once FlowWatch has run.
            pass


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
