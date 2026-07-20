"""Learner identity and progress tracking for PRISM (Tutor Analytics).

Provides demo learner profiles and aggregated progress stats
computed from mastery_history and tutor_sessions.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/learners", tags=["learners"])

# ---------------------------------------------------------------------------
# Demo learner registry (temporary, replaced by auth in production)
# ---------------------------------------------------------------------------

DEMO_LEARNERS: list[dict[str, str | int]] = [
    {"id": 1, "name": "Aanya Sharma", "description": "Grade-level learner, consistent performer"},
    {"id": 2, "name": "Ravi Kumar", "description": "Foundational learner, needs prerequisite support"},
    {"id": 3, "name": "Priya Patel", "description": "Advanced learner, quick mastery"},
    {"id": 4, "name": "Arjun Singh", "description": "Developing learner, improving steadily"},
    {"id": 5, "name": "Meera Iyer", "description": "Grade-level learner, strong in Science"},
    {"id": 6, "name": "Kabir Das", "description": "Foundational learner, struggles with word problems"},
    {"id": 7, "name": "Nisha Reddy", "description": "Advanced learner, excels in English"},
    {"id": 8, "name": "Vikram Joshi", "description": "Developing learner, inconsistent performance"},
]


@router.get("")
def list_learners() -> dict:
    """Return all available demo learners."""
    return {"learners": DEMO_LEARNERS}


@router.get("/{learner_id}/progress")
def get_learner_progress(learner_id: int) -> dict:
    """Return aggregated progress stats for a learner.

    Computed live from mastery_history and tutor_sessions tables.
    """
    initialize_tutor_analytics_tables()
    lid = str(learner_id)

    with connect() as conn:
        with conn.cursor() as cur:
            # Questions attempted (distinct question_ids in tutor_sessions with a learner answer)
            cur.execute(
                """
                SELECT COUNT(DISTINCT question_id) AS questions_attempted
                FROM tutor_sessions
                WHERE learner_id = %s
                """,
                (lid,),
            )
            row = cur.fetchone()
            questions_attempted = row["questions_attempted"] if row else 0

            # Questions solved correctly (has a check_thinking response = correct)
            cur.execute(
                """
                SELECT COUNT(DISTINCT question_id) AS questions_correct
                FROM tutor_sessions
                WHERE learner_id = %s AND response_mode = 'check_thinking'
                """,
                (lid,),
            )
            row = cur.fetchone()
            questions_correct = row["questions_correct"] if row else 0

            # Hints used
            cur.execute(
                """
                SELECT COUNT(*) AS hints_used
                FROM mastery_history
                WHERE learner_id = %s AND hint_used = true
                """,
                (lid,),
            )
            row = cur.fetchone()
            hints_used = row["hints_used"] if row else 0

            # Concepts covered (distinct concept_ids in mastery_history)
            cur.execute(
                """
                SELECT COUNT(DISTINCT concept_id) AS concepts_covered
                FROM mastery_history
                WHERE learner_id = %s
                """,
                (lid,),
            )
            row = cur.fetchone()
            concepts_covered = row["concepts_covered"] if row else 0

            # Average mastery (latest p_know per concept)
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
                (lid,),
            )
            row = cur.fetchone()
            avg_mastery = round(row["avg_mastery"], 3) if row and row["avg_mastery"] else 0.0

            # Strong and weak topics
            cur.execute(
                """
                SELECT DISTINCT ON (concept_id) concept_id, p_know
                FROM mastery_history
                WHERE learner_id = %s
                ORDER BY concept_id, created_at DESC, id DESC
                """,
                (lid,),
            )
            concept_rows = cur.fetchall()
            strong_topics = [r["concept_id"] for r in concept_rows if r["p_know"] >= 0.70]
            weak_topics = [r["concept_id"] for r in concept_rows if r["p_know"] < 0.40]

    # Find learner name
    learner_name = None
    for l in DEMO_LEARNERS:
        if l["id"] == learner_id:
            learner_name = l["name"]
            break

    return {
        "learner_id": learner_id,
        "learner_name": learner_name,
        "questions_attempted": questions_attempted,
        "questions_correct": questions_correct,
        "hints_used": hints_used,
        "concepts_covered": concepts_covered,
        "avg_mastery": avg_mastery,
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
    }
