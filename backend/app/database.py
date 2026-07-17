"""PostgreSQL-backed curriculum catalog for the PRISM prototype."""

import os

import psycopg
from psycopg.rows import dict_row

SEED_SUBJECTS = (
    (8, "mathematics", "Mathematics"),
    (8, "science", "Science"),
    (8, "english", "English"),
)

SEED_UNITS = (
    (8, "mathematics", "number-systems", "Number Systems", 1),
    (8, "mathematics", "algebraic-expressions", "Algebraic Expressions", 2),
    (8, "mathematics", "linear-equations", "Linear Equations", 3),
    (8, "science", "crop-production", "Crop Production and Management", 1),
    (8, "science", "microorganisms", "Microorganisms: Friend and Foe", 2),
    (8, "science", "force-and-pressure", "Force and Pressure", 3),
    (8, "english", "reading", "Reading for Meaning", 1),
    (8, "english", "grammar", "Grammar in Context", 2),
    (8, "english", "writing", "Writing with Purpose", 3),
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
                    position INTEGER NOT NULL
                );
                """
            )
            cursor.executemany(
                """
                INSERT INTO subjects (grade, slug, name) VALUES (%s, %s, %s)
                ON CONFLICT (slug) DO NOTHING
                """,
                SEED_SUBJECTS,
            )
            cursor.executemany(
                """
                INSERT INTO units (grade, subject_slug, slug, name, position)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO NOTHING
                """,
                SEED_UNITS,
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
