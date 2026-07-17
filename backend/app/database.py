"""SQLite-backed curriculum catalog for the PRISM prototype."""

import os
import sqlite3
from pathlib import Path

DEFAULT_DATABASE_PATH = Path(__file__).resolve().parents[1] / "prism.db"

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


def database_path() -> Path:
    return Path(os.environ.get("PRISM_DATABASE_PATH", DEFAULT_DATABASE_PATH))


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(database_path())
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with connect() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY,
                grade INTEGER NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS units (
                id INTEGER PRIMARY KEY,
                grade INTEGER NOT NULL,
                subject_slug TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                position INTEGER NOT NULL
            );
            """
        )
        connection.executemany(
            "INSERT OR IGNORE INTO subjects (grade, slug, name) VALUES (?, ?, ?)",
            SEED_SUBJECTS,
        )
        connection.executemany(
            "INSERT OR IGNORE INTO units (grade, subject_slug, slug, name, position) VALUES (?, ?, ?, ?, ?)",
            SEED_UNITS,
        )


def subjects_for_grade(grade: int) -> list[dict[str, str | int]]:
    initialize_database()
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT subjects.slug, subjects.name, COUNT(units.id) AS unit_count
            FROM subjects
            LEFT JOIN units ON units.subject_slug = subjects.slug AND units.grade = subjects.grade
            WHERE subjects.grade = ?
            GROUP BY subjects.id
            ORDER BY subjects.id
            """,
            (grade,),
        ).fetchall()
    return [dict(row) for row in rows]
