"""Teacher intervention dashboard endpoints for PRISM (Tutor Analytics).

Exposes cohort overview, individual student intervention cards, and
ranked misconception clusters — all derived from persisted event data.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/teacher", tags=["teacher"])


@router.get("/cohort")
def get_cohort_overview(grade: int = 8) -> dict:
    """Return the cohort command-center data for a grade.

    Includes band distribution, session counts, top clusters, and
    ranked intervention recommendations.
    """
    initialize_tutor_analytics_tables()
    with connect() as conn:
        with conn.cursor() as cur:
            # Band distribution
            cur.execute(
                """
                SELECT band, COUNT(*) AS count
                FROM teacher_summaries
                WHERE grade = %s
                GROUP BY band
                ORDER BY count DESC
                """,
                (grade,),
            )
            band_rows = cur.fetchall()
            total_learners = sum(r["count"] for r in band_rows)
            bands = {r["band"]: r["count"] for r in band_rows}

            # Top misconception clusters (ranked by impact_score)
            cur.execute(
                """
                SELECT error_tag, concept_id, affected_count, total_active,
                       recent_incorrect_rate, repeat_error_rate,
                       trend_growth, impact_score, suggested_intervention
                FROM misconception_clusters
                WHERE grade = %s
                ORDER BY impact_score DESC
                LIMIT 5
                """,
                (grade,),
            )
            clusters = cur.fetchall()

            # Students needing intervention (those with a blocker)
            cur.execute(
                """
                SELECT learner_id, band, current_path, current_target_concept,
                       likely_blocker_concept, blocker_confidence,
                       evidence_summary, recommended_action, pending_sync_count
                FROM teacher_summaries
                WHERE grade = %s AND likely_blocker_concept IS NOT NULL
                ORDER BY blocker_confidence DESC NULLS LAST
                LIMIT 10
                """,
                (grade,),
            )
            interventions = cur.fetchall()

            return {
                "grade": grade,
                "total_learners": total_learners,
                "band_distribution": bands,
                "top_clusters": clusters,
                "intervention_recommendations": interventions,
            }


@router.get("/student/{learner_id}")
def get_student_card(learner_id: str) -> dict:
    """Return the intervention card for a specific student."""
    initialize_tutor_analytics_tables()
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT learner_id, grade, band, current_path,
                       current_target_concept, likely_blocker_concept,
                       blocker_confidence, evidence_summary,
                       recommended_action, pending_sync_count, updated_at
                FROM teacher_summaries
                WHERE learner_id = %s
                """,
                (learner_id,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(
                    status_code=404, detail="Student not found"
                )
            return row


@router.get("/clusters")
def get_misconception_clusters(grade: int = 8) -> dict:
    """Return ranked misconception clusters for a grade."""
    initialize_tutor_analytics_tables()
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT error_tag, concept_id, affected_count, total_active,
                       recent_incorrect_rate, repeat_error_rate,
                       trend_growth, impact_score, suggested_intervention,
                       updated_at
                FROM misconception_clusters
                WHERE grade = %s
                ORDER BY impact_score DESC
                """,
                (grade,),
            )
            rows = cur.fetchall()
            return {"grade": grade, "clusters": rows}
