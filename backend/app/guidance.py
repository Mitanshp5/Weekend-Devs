"""Guidance endpoint for PRISM AI Tutor.

Provides deterministic, evidence-based responses to learner questions like
"Am I on track?", "What should I study next?", and "Recommend practice".
All data comes from mastery_history — no LLM required.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.database import connect
from app.tutor_analytics_models import initialize_tutor_analytics_tables

router = APIRouter(prefix="/api/tutor", tags=["guidance"])

# Lazy-loaded concept metadata from DB: concept_id -> {name, unit}
_concept_cache: dict[str, dict] | None = None


def _load_concept_cache() -> dict[str, dict]:
    """Load concept friendly names and unit slugs from the DB. Cached for the process lifetime."""
    global _concept_cache
    if _concept_cache is not None:
        return _concept_cache
    try:
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT c.slug AS concept_slug, c.name AS concept_name, u.slug AS unit_slug
                    FROM concepts c
                    JOIN units u ON u.slug = c.unit_slug
                    """
                )
                rows = cur.fetchall()
        _concept_cache = {
            r["concept_slug"]: {"name": r["concept_name"], "unit": r["unit_slug"]}
            for r in rows
        }
    except Exception:
        _concept_cache = {}
    return _concept_cache


from app.tutor import CONCEPT_FRIENDLY_NAMES

def _concept_friendly(concept_id: str) -> str:
    if concept_id in CONCEPT_FRIENDLY_NAMES:
        return CONCEPT_FRIENDLY_NAMES[concept_id]
    cache = _load_concept_cache()
    return cache.get(concept_id, {}).get("name", concept_id.replace("_", " ").replace(".", " ").title())


def _concept_unit(concept_id: str) -> str:
    cache = _load_concept_cache()
    unit = cache.get(concept_id, {}).get("unit")
    if unit:
        return unit
    if concept_id.startswith(("math.", "num.", "eq.")):
        return "Linear Equations & Algebra"
    if concept_id.startswith("sci."):
        return "Science & Environment"
    if concept_id.startswith("eng."):
        return "English Literature"
    return "the next unit"


def _concept_subject(concept_id: str) -> str:
    if concept_id.startswith(("math.", "num.", "eq.")):
        return "mathematics"
    if concept_id.startswith("sci."):
        return "science"
    if concept_id.startswith("eng."):
        return "english"
    return "unknown"


class GuidanceRequest(BaseModel):
    learner_id: str
    question_type: str  # am_i_on_track | what_to_study_next | recommend_practice
    subject: str | None = None


@router.post("/guidance")
def tutor_guidance(req: GuidanceRequest) -> dict:
    """Return deterministic guidance based on learner's mastery_history data."""
    initialize_tutor_analytics_tables()
    learner_id = req.learner_id.strip() if (req.learner_id and req.learner_id.strip()) else "aanya@prism.demo"

    with connect() as conn:
        with conn.cursor() as cur:
            # Get latest mastery per concept
            cur.execute(
                """
                SELECT DISTINCT ON (concept_id) concept_id, p_know, evidence_count,
                       independent_correct_count, recent_error_tags, hint_used
                FROM mastery_history
                WHERE learner_id = %s
                ORDER BY concept_id, created_at DESC, id DESC
                """,
                (learner_id,),
            )
            concept_rows = cur.fetchall()

            # Get total questions attempted
            cur.execute(
                "SELECT COUNT(DISTINCT question_id) AS total FROM tutor_sessions WHERE learner_id = %s",
                (learner_id,),
            )
            row = cur.fetchone()
            total_q = row["total"] if row else 0

            # Get total hints used
            cur.execute(
                "SELECT COUNT(*) AS total FROM mastery_history WHERE learner_id = %s AND hint_used = true",
                (learner_id,),
            )
            row = cur.fetchone()
            total_hints = row["total"] if row else 0

    # Filter by subject if specified
    if req.subject:
        concept_rows = [r for r in concept_rows if _concept_subject(r["concept_id"]) == req.subject]

    mastered = [r for r in concept_rows if r["p_know"] >= 0.70]
    developing = [r for r in concept_rows if 0.40 <= r["p_know"] < 0.70]
    weak = [r for r in concept_rows if r["p_know"] < 0.40]

    if req.question_type == "am_i_on_track":
        return _am_i_on_track(concept_rows, mastered, developing, weak, total_q, total_hints)
    elif req.question_type == "what_to_study_next":
        return _what_to_study_next(concept_rows, weak, developing, req.subject)
    elif req.question_type == "recommend_practice":
        return _recommend_practice(weak, developing)
    else:
        return {
            "question_type": req.question_type,
            "message": "I'm not sure what you're asking. Try 'Am I on track?', 'What should I study next?', or 'Recommend practice questions'.",
            "details": {},
        }


def _am_i_on_track(
    concept_rows: list, mastered: list, developing: list, weak: list,
    total_q: int, total_hints: int,
) -> dict:
    if not concept_rows:
        return {
            "question_type": "am_i_on_track",
            "message": "You haven't started any questions yet! Pick a question from the list to begin your learning journey. 🚀",
            "details": {"status": "not_started"},
        }

    total = len(concept_rows)

    # Calculate average p_know for overall understanding level
    avg_p = sum(r["p_know"] for r in concept_rows) / total

    # Determine overall understanding level label
    if avg_p >= 0.70:
        level_label = "Strong"
        level_emoji = "🟢"
        level_desc = "You have a solid grasp of the concepts you've studied."
    elif avg_p >= 0.40:
        level_label = "Developing"
        level_emoji = "🟡"
        level_desc = "You're building understanding — keep practicing to strengthen your skills."
    else:
        level_label = "Needs Practice"
        level_emoji = "🔴"
        level_desc = "You're just getting started — more practice will help these concepts click."

    parts = []

    # Lead with encouragement and understanding level
    parts.append(f"{level_emoji} Understanding Level: **{level_label}**")
    parts.append(level_desc)

    # Natural language stats
    if total_q > 0:
        parts.append(f"📝 You've attempted {total_q} question{'s' if total_q != 1 else ''} across {total} concept{'s' if total != 1 else ''}, using {total_hints} hint{'s' if total_hints != 1 else ''}.")

    # Strong topics with friendly names
    if mastered:
        strong_names = [_concept_friendly(r["concept_id"]) for r in mastered[:3]]
        parts.append(f"💪 Strong topics: {', '.join(strong_names)}")

    # Developing topics with friendly names
    if developing:
        dev_names = [_concept_friendly(r["concept_id"]) for r in developing[:3]]
        parts.append(f"🔄 Getting there: {', '.join(dev_names)} — a few more correct answers will level these up!")

    # Weak topics with friendly names
    if weak:
        weak_names = [_concept_friendly(r["concept_id"]) for r in weak[:3]]
        parts.append(f"🔧 Focus areas: {', '.join(weak_names)} — try more practice questions on these topics.")

    return {
        "question_type": "am_i_on_track",
        "message": "\n".join(parts),
        "details": {
            "total_concepts": total,
            "mastered": len(mastered),
            "developing": len(developing),
            "weak": len(weak),
            "understanding_level": level_label,
            "avg_p_know": round(avg_p, 2),
            "questions_attempted": total_q,
            "hints_used": total_hints,
        },
    }


def _what_to_study_next(
    concept_rows: list, weak: list, developing: list, subject: str | None,
) -> dict:
    if not concept_rows:
        subj_text = f" in {subject}" if subject else ""
        return {
            "question_type": "what_to_study_next",
            "message": f"You haven't started yet{subj_text}! I'd recommend starting with the first unit in the question list.",
            "details": {"status": "not_started"},
        }

    # Recommend weakest concept first, then developing
    candidates = weak + developing
    if candidates:
        top = candidates[0]
        name = _concept_friendly(top["concept_id"])
        unit = _concept_unit(top["concept_id"])
        p = round(top["p_know"] * 100)
        return {
            "question_type": "what_to_study_next",
            "message": f"📚 I recommend focusing on **{name}** (current mastery: {p}%). Practice more questions from the \"{unit.replace('-', ' ').title()}\" unit to strengthen this concept.",
            "details": {"concept_id": top["concept_id"], "p_know": top["p_know"], "unit": unit},
        }

    # All mastered — suggest new topics
    covered_ids = {r["concept_id"] for r in concept_rows}
    uncovered = [cid for cid in _load_concept_cache() if cid not in covered_ids]
    if subject:
        uncovered = [cid for cid in uncovered if _concept_subject(cid) == subject]

    if uncovered:
        next_cid = uncovered[0]
        name = _concept_friendly(next_cid)
        return {
            "question_type": "what_to_study_next",
            "message": f"🎉 Amazing — you've mastered everything you've attempted! Next up: **{name}**. Find it in the question list.",
            "details": {"concept_id": next_cid},
        }

    return {
        "question_type": "what_to_study_next",
        "message": "🏆 You've mastered all available concepts! You're doing brilliantly. Check back later for new content.",
        "details": {"status": "all_mastered"},
    }


def _recommend_practice(weak: list, developing: list) -> dict:
    candidates = weak + developing
    if not candidates:
        return {
            "question_type": "recommend_practice",
            "message": "You're doing great — no weak areas to target right now! Try a new topic from the question list to keep expanding your knowledge. 🌟",
            "details": {"status": "no_weak_areas"},
        }

    names = [_concept_friendly(r["concept_id"]) for r in candidates[:4]]
    parts = ["Based on your performance, focus on these topics:"]
    for i, name in enumerate(names, 1):
        p = round(candidates[i - 1]["p_know"] * 100)
        parts.append(f"  {i}. **{name}** ({p}% mastery)")
    parts.append("\nSelect questions from these concepts in the list to practice more!")

    return {
        "question_type": "recommend_practice",
        "message": "\n".join(parts),
        "details": {"recommended_concepts": [r["concept_id"] for r in candidates[:4]]},
    }
