"""Learner identity and progress tracking for PRISM (Tutor Analytics).

Provides registered learner profiles with **dynamic** descriptions and aggregated
progress stats computed from mastery_history and tutor_sessions.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/learners", tags=["learners"])



def _compute_description(learner_id: str | int) -> str:
    """Build a one-line profile description from the learner's actual DB data.

    Uses the same underlying data as the guidance algorithm:
    mastery_history (p_know, evidence_count) and tutor_sessions.
    """
    lid = str(learner_id)

    try:
        with connect() as conn:
            with conn.cursor() as cur:
                # Questions attempted
                cur.execute(
                    "SELECT COUNT(DISTINCT question_id) AS total FROM tutor_sessions WHERE learner_id = %s",
                    (lid,),
                )
                row = cur.fetchone()
                total_q = row["total"] if row else 0

                if total_q == 0:
                    return "New learner — no activity yet"

                # Questions solved correctly (check_thinking = correct confirmation)
                cur.execute(
                    "SELECT COUNT(DISTINCT question_id) AS total FROM tutor_sessions WHERE learner_id = %s AND response_mode = 'check_thinking'",
                    (lid,),
                )
                row = cur.fetchone()
                correct_q = row["total"] if row else 0

                # Hints used
                cur.execute(
                    "SELECT COUNT(*) AS total FROM mastery_history WHERE learner_id = %s AND hint_used = true",
                    (lid,),
                )
                row = cur.fetchone()
                hints_used = row["total"] if row else 0

                # Average mastery (latest p_know per concept)
                cur.execute(
                    """
                    SELECT AVG(latest.p_know) AS avg_mastery, COUNT(*) AS concept_count
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
                avg_mastery = round(row["avg_mastery"], 2) if row and row["avg_mastery"] else 0.0
                concept_count = row["concept_count"] if row else 0

        # Build a human-readable one-liner
        mastery_pct = round(avg_mastery * 100)

        # Determine performance band
        if mastery_pct >= 70:
            band = "Strong"
        elif mastery_pct >= 40:
            band = "Developing"
        else:
            band = "Foundational"

        # Determine hint dependency
        hint_rate = hints_used / max(total_q, 1)
        if hint_rate > 0.5:
            hint_note = ", relies on hints"
        elif hint_rate > 0.2:
            hint_note = ", occasional hints"
        else:
            hint_note = ""

        correct_pct = round(correct_q / total_q * 100) if total_q else 0

        return f"{band} ({mastery_pct}% mastery) · {total_q} Qs attempted, {correct_pct}% correct{hint_note}"

    except Exception:
        return "New learner — no activity yet"


@router.get("")
def list_learners() -> dict:
    """Return all registered student accounts with dynamic performance descriptions."""
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

        learners = [
            {
                "id": row["email"],
                "name": row["username"] or row["email"].split("@")[0].title(),
                "email": row["email"],
                "description": _compute_description(row["email"]),
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
