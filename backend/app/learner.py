"""Learner identity and progress tracking for PRISM (Tutor Analytics).

Provides registered learner profiles and aggregated progress stats
computed from mastery_history and tutor_sessions.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/learners", tags=["learners"])


@router.get("")
def list_learners() -> dict:
    """Return all registered student accounts from the auth_users table."""
    initialize_tutor_analytics_tables()
    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT username, email
                    FROM auth_users
                    WHERE role = 'student'
                    ORDER BY created_at ASC
                    LIMIT 50
                    """
                )
                rows = cur.fetchall()

        # Map email-based learner records with descriptions from seed definitions
        LEARNER_DESCRIPTIONS = {
            "aanya@prism.demo": "Grade-level learner, consistent performer",
            "ravi@prism.demo": "Foundational learner, needs prerequisite support",
            "priya@prism.demo": "Advanced learner, quick mastery",
            "arjun@prism.demo": "Developing learner, improving steadily",
            "meera@prism.demo": "Grade-level learner, strong in Science",
            "kabir@prism.demo": "Foundational learner, struggles with word problems",
            "nisha@prism.demo": "Advanced learner, excels in English",
            "vikram@prism.demo": "Developing learner, inconsistent performance",
        }

        learners = [
            {
                "id": row["email"],  # Use email as learner_id for backend queries
                "name": row["username"] or row["email"].split("@")[0].title(),
                "email": row["email"],
                "description": LEARNER_DESCRIPTIONS.get(row["email"], "Student"),
            }
            for row in rows
        ]
        return {"learners": learners}
    except Exception:
        # Fallback if auth_users table not yet available
        return {"learners": []}


@router.get("/{learner_id}/progress")
def get_learner_progress(learner_id: str) -> dict:
    """Return aggregated progress stats for a learner (keyed by email)."""
    initialize_tutor_analytics_tables()

    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(DISTINCT question_id) AS questions_attempted
                FROM tutor_sessions
                WHERE learner_id = %s
                """,
                (learner_id,),
            )
            row = cur.fetchone()
            questions_attempted = row["questions_attempted"] if row else 0

            cur.execute(
                """
                SELECT COUNT(DISTINCT question_id) AS questions_correct
                FROM tutor_sessions
                WHERE learner_id = %s AND response_mode = 'check_thinking'
                """,
                (learner_id,),
            )
            row = cur.fetchone()
            questions_correct = row["questions_correct"] if row else 0

            cur.execute(
                """
                SELECT COUNT(*) AS hints_used
                FROM mastery_history
                WHERE learner_id = %s AND hint_used = true
                """,
                (learner_id,),
            )
            row = cur.fetchone()
            hints_used = row["hints_used"] if row else 0

            cur.execute(
                """
                SELECT COUNT(DISTINCT concept_id) AS concepts_covered
                FROM mastery_history
                WHERE learner_id = %s
                """,
                (learner_id,),
            )
            row = cur.fetchone()
            concepts_covered = row["concepts_covered"] if row else 0

            cur.execute(
                """
                SELECT AVG(latest.p_know) AS avg_mastery
                FROM (
                    SELECT DISTINCT ON (concept_id) p_know
                    FROM mastery_history
                    WHERE learner_id = %s
                    ORDER BY concept_id, created_at DESC, id DESC
                ) latest
                """,
                (learner_id,),
            )
            row = cur.fetchone()
            avg_mastery = round(row["avg_mastery"], 3) if row and row["avg_mastery"] else 0.0

            cur.execute(
                """
                SELECT DISTINCT ON (concept_id) concept_id, p_know
                FROM mastery_history
                WHERE learner_id = %s
                ORDER BY concept_id, created_at DESC, id DESC
                """,
                (learner_id,),
            )
            concept_rows = cur.fetchall()
            strong_topics = [r["concept_id"] for r in concept_rows if r["p_know"] >= 0.70]
            weak_topics = [r["concept_id"] for r in concept_rows if r["p_know"] < 0.40]

    # Resolve name from auth_users
    learner_name = None
    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT username FROM auth_users WHERE email = %s",
                    (learner_id,),
                )
                row = cur.fetchone()
                if row:
                    learner_name = row["username"]
    except Exception:
        pass

    return {
        "learner_id": learner_id,
        "learner_name": learner_name or learner_id.split("@")[0].title(),
        "questions_attempted": questions_attempted,
        "questions_correct": questions_correct,
        "hints_used": hints_used,
        "concepts_covered": concepts_covered,
        "avg_mastery": avg_mastery,
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
    }
