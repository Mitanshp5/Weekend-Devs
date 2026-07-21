"""Learner identity and progress tracking for PRISM (Tutor Analytics).

Provides demo learner profiles with **dynamic** descriptions computed
from mastery_history and tutor_sessions — no hardcoded labels.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/learners", tags=["learners"])

# ---------------------------------------------------------------------------
# Demo learner registry (temporary, replaced by auth in production)
# Names only — descriptions are computed dynamically from DB performance.
# ---------------------------------------------------------------------------

DEMO_LEARNERS: list[dict[str, str | int]] = [
    {"id": 1, "name": "Aanya Sharma"},
    {"id": 2, "name": "Ravi Kumar"},
    {"id": 3, "name": "Priya Patel"},
    {"id": 4, "name": "Arjun Singh"},
    {"id": 5, "name": "Meera Iyer"},
    {"id": 6, "name": "Kabir Das"},
    {"id": 7, "name": "Nisha Reddy"},
    {"id": 8, "name": "Vikram Joshi"},
]


def _compute_description(learner_id: int) -> str:
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
    """Return all available demo learners with dynamic descriptions."""
    initialize_tutor_analytics_tables()
    enriched = []
    for learner in DEMO_LEARNERS:
        desc = _compute_description(learner["id"])  # type: ignore[arg-type]
        enriched.append({**learner, "description": desc})
    return {"learners": enriched}


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
