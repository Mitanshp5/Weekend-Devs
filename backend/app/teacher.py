"""Teacher intervention dashboard endpoints for PRISM (Tutor Analytics).

Exposes cohort overview, individual student intervention cards, and
ranked misconception clusters.

**Dynamic mode**: When any real learner (IDs 1-8) has session data,
cohort stats and clusters are computed live from mastery_history and
tutor_sessions — not from the static teacher_summaries table.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

# Real demo learner IDs (string form, matching tutor session records)
_REAL_LEARNER_IDS = [str(i) for i in range(1, 9)]


def _has_real_activity(cur) -> bool:
    """Check if any real learner (1-8) has tutor session records."""
    cur.execute(
        "SELECT EXISTS(SELECT 1 FROM tutor_sessions WHERE learner_id = ANY(%s)) AS has_data",
        (_REAL_LEARNER_IDS,),
    )
    row = cur.fetchone()
    return bool(row and row["has_data"])


def _band_for_mastery(p_know: float, indep_correct: int) -> str:
    """Classify a learner into a band based on mastery."""
    if p_know >= 0.70 and indep_correct >= 3:
        return "ready_for_extension"
    if p_know >= 0.40:
        return "developing"
    return "needs_prerequisite_support"


def _dynamic_cohort(cur, grade: int) -> dict:
    """Compute cohort overview dynamically from mastery_history for real learners."""
    # Get latest mastery per concept per learner
    cur.execute(
        """
        SELECT DISTINCT ON (learner_id, concept_id)
            learner_id, concept_id, p_know, evidence_count,
            independent_correct_count, recent_error_tags
        FROM mastery_history
        WHERE learner_id = ANY(%s)
        ORDER BY learner_id, concept_id, created_at DESC, id DESC
        """,
        (_REAL_LEARNER_IDS,),
    )
    rows = cur.fetchall()

    if not rows:
        return {
            "grade": grade,
            "total_learners": 0,
            "band_distribution": {},
            "top_clusters": [],
            "intervention_recommendations": [],
        }

    # --- Band distribution: aggregate per learner ---
    learner_data: dict[str, list] = {}
    for r in rows:
        learner_data.setdefault(r["learner_id"], []).append(r)

    band_counts: dict[str, int] = {}
    interventions = []

    for lid, concepts in learner_data.items():
        avg_p = sum(c["p_know"] for c in concepts) / len(concepts)
        total_indep = sum(c["independent_correct_count"] for c in concepts)
        band = _band_for_mastery(avg_p, total_indep)
        band_counts[band] = band_counts.get(band, 0) + 1

        # Find weakest concept as potential blocker
        weakest = min(concepts, key=lambda c: c["p_know"])
        blocker = weakest["concept_id"] if weakest["p_know"] < 0.40 else None
        blocker_conf = round(1.0 - weakest["p_know"], 2) if blocker else None

        total_evidence = sum(c["evidence_count"] for c in concepts)

        if blocker:
            interventions.append({
                "learner_id": lid,
                "band": band,
                "current_path": "Grade-Level",
                "current_target_concept": weakest["concept_id"],
                "likely_blocker_concept": blocker,
                "blocker_confidence": blocker_conf,
                "evidence_summary": f"{total_evidence} total attempts across {len(concepts)} concepts",
                "recommended_action": "Needs direct intervention" if band == "needs_prerequisite_support" else "Review weak concept",
                "pending_sync_count": 0,
            })

    interventions.sort(key=lambda x: x.get("blocker_confidence") or 0, reverse=True)

    # --- Misconception clusters: aggregate error tags across learners ---
    error_concept_map: dict[tuple[str, str], int] = {}
    total_active_learners = len(learner_data)

    for r in rows:
        for tag in (r["recent_error_tags"] or []):
            key = (tag, r["concept_id"])
            error_concept_map[key] = error_concept_map.get(key, 0) + 1

    clusters = []
    for (error_tag, concept_id), affected in sorted(
        error_concept_map.items(), key=lambda x: x[1], reverse=True
    )[:5]:
        impact = round(affected / max(total_active_learners, 1), 2)
        clusters.append({
            "error_tag": error_tag,
            "concept_id": concept_id,
            "affected_count": affected,
            "total_active": total_active_learners,
            "recent_incorrect_rate": impact,
            "repeat_error_rate": 0,
            "trend_growth": 0,
            "impact_score": impact,
            "suggested_intervention": f"Review {error_tag.replace('_', ' ')} with focused practice",
        })

    return {
        "grade": grade,
        "total_learners": len(learner_data),
        "band_distribution": band_counts,
        "top_clusters": clusters,
        "intervention_recommendations": interventions[:10],
    }


@router.get("/cohort")
def get_cohort_overview(grade: int = 8) -> dict:
    """Return the cohort command-center data for a grade.

    Uses dynamic computation from mastery_history when real learners
    have activity. Falls back to teacher_summaries table otherwise.
    """
    initialize_tutor_analytics_tables()
    with connect() as conn:
        with conn.cursor() as cur:
            if _has_real_activity(cur):
                return _dynamic_cohort(cur, grade)

            # ---------- Static fallback (legacy seed/test data) ----------
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
            # Try dynamic first for real learners
            if learner_id in _REAL_LEARNER_IDS:
                cur.execute(
                    """
                    SELECT DISTINCT ON (concept_id)
                        concept_id, p_know, evidence_count,
                        independent_correct_count, recent_error_tags
                    FROM mastery_history
                    WHERE learner_id = %s
                    ORDER BY concept_id, created_at DESC, id DESC
                    """,
                    (learner_id,),
                )
                concepts = cur.fetchall()
                if concepts:
                    avg_p = sum(c["p_know"] for c in concepts) / len(concepts)
                    total_indep = sum(c["independent_correct_count"] for c in concepts)
                    band = _band_for_mastery(avg_p, total_indep)
                    weakest = min(concepts, key=lambda c: c["p_know"])
                    blocker = weakest["concept_id"] if weakest["p_know"] < 0.40 else None
                    total_evidence = sum(c["evidence_count"] for c in concepts)

                    return {
                        "learner_id": learner_id,
                        "grade": 8,
                        "band": band,
                        "current_path": "Grade-Level",
                        "current_target_concept": weakest["concept_id"],
                        "likely_blocker_concept": blocker,
                        "blocker_confidence": round(1.0 - weakest["p_know"], 2) if blocker else None,
                        "evidence_summary": f"{total_evidence} attempts across {len(concepts)} concepts",
                        "recommended_action": "Needs direct intervention" if band == "needs_prerequisite_support" else "Keep learning",
                        "pending_sync_count": 0,
                        "updated_at": None,
                    }

            # Static fallback
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
    """Return ranked misconception clusters for a grade.

    Dynamic when real activity exists; static fallback otherwise.
    """
    initialize_tutor_analytics_tables()
    with connect() as conn:
        with conn.cursor() as cur:
            if _has_real_activity(cur):
                result = _dynamic_cohort(cur, grade)
                return {"grade": grade, "clusters": result["top_clusters"]}

            # Static fallback
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
