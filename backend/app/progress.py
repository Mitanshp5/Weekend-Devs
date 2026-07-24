"""Progress evidence endpoints for PRISM (Tutor Analytics).

Exposes mastery history and evidence ledger data that the frontend
renders as timelines and per-concept drill-downs.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/progress", tags=["progress"])

# Mastery band boundaries (from the spec)
_BANDS = [
    (0.70, "ready_for_extension", "Ready for the next challenge.",
     "Likely mastered; confirm with transfer item."),
    (0.40, "developing", "You are getting there — one more check.",
     "Developing; evidence still limited."),
    (0.00, "needs_prerequisite_support", "Let's rebuild this idea.",
     "Needs prerequisite repair."),
]


def _band_for_p_know(p_know: float, independent_correct: int) -> dict:
    """Return the mastery band, learner wording, and teacher wording."""
    for threshold, band, learner_msg, teacher_msg in _BANDS:
        if p_know >= threshold:
            # The top band additionally requires independent evidence
            if band == "ready_for_extension" and independent_correct < 3:
                continue
            return {
                "band": band,
                "learner_message": learner_msg,
                "teacher_message": teacher_msg,
            }
    # fallback
    return {
        "band": "needs_prerequisite_support",
        "learner_message": "Let's rebuild this idea.",
        "teacher_message": "Needs prerequisite repair.",
    }


@router.get("/{learner_id}")
def get_learner_progress(learner_id: str) -> dict:
    """Return the latest mastery state per concept for a learner."""
    initialize_tutor_analytics_tables()
    safe_learner_id = learner_id.strip() if (learner_id and learner_id.strip()) else "aanya@prism.demo"
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT ON (concept_id)
                    concept_id, p_know, evidence_count,
                    independent_correct_count, recent_error_tags,
                    uncertainty, hint_used, created_at
                FROM mastery_history
                WHERE learner_id = %s
                ORDER BY concept_id, created_at DESC
                """,
                (safe_learner_id,),
            )
            rows = cur.fetchall()
            if not rows:
                return {"learner_id": safe_learner_id, "concepts": []}
            concepts = []
            for row in rows:
                band_info = _band_for_p_know(
                    row["p_know"], row["independent_correct_count"]
                )
                concepts.append({**row, **band_info})
            return {"learner_id": safe_learner_id, "concepts": concepts}


@router.get("/{learner_id}/concept/{concept_id}")
def get_concept_evidence(learner_id: str, concept_id: str) -> dict:
    """Return the full evidence timeline for a learner-concept pair."""
    initialize_tutor_analytics_tables()
    safe_learner_id = learner_id.strip() if (learner_id and learner_id.strip()) else "aanya@prism.demo"
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, p_know, evidence_count,
                       independent_correct_count, recent_error_tags,
                       uncertainty, hint_used, created_at
                FROM mastery_history
                WHERE learner_id = %s AND concept_id = %s
                ORDER BY created_at ASC
                """,
                (safe_learner_id, concept_id),
            )
            rows = cur.fetchall()
            if not rows:
                raise HTTPException(
                    status_code=404,
                    detail="No evidence found for this learner-concept pair",
                )
            timeline = []
            for row in rows:
                band_info = _band_for_p_know(
                    row["p_know"], row["independent_correct_count"]
                )
                timeline.append({**row, **band_info})
            return {
                "learner_id": learner_id,
                "concept_id": concept_id,
                "timeline": timeline,
            }
