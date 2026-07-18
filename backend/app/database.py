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
