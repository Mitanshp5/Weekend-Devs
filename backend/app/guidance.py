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

# Concept-to-unit mapping for study recommendations
CONCEPT_UNIT_MAP: dict[str, str] = {
    # Math
    "num.signed_operations": "rational-numbers",
    "eq.inverse_operations": "linear-equations-in-one-variable",
    "eq.multi_step": "linear-equations-in-one-variable",
    "eq.word_translation": "linear-equations-in-one-variable",
    "num.mul_div_fluency": "rational-numbers",
    "math.rational_numbers": "rational-numbers",
    "math.linear_equations": "linear-equations-in-one-variable",
    "math.quadrilaterals": "understanding-quadrilaterals",
    "math.data_handling": "data-handling",
    "math.squares_roots": "squares-and-square-roots",
    # Science
    "sci.crop_production": "crop-production-and-management",
    "sci.microorganisms": "microorganisms-friend-and-foe",
    "sci.coal_petroleum": "coal-and-petroleum",
    "sci.combustion_flame": "combustion-and-flame",
    "sci.conservation": "conservation-of-plants-and-animals",
    # English
    "eng.christmas_present": "the-best-christmas-present",
    "eng.tsunami": "the-tsunami",
    "eng.glimpses_past": "glimpses-of-the-past",
    "eng.bepin_choudhury": "bepin-choudhurys-lapse-of-memory",
    "eng.summit_within": "the-summit-within",
}

CONCEPT_FRIENDLY: dict[str, str] = {
    "num.signed_operations": "Integer Operations",
    "eq.inverse_operations": "Inverse Operations",
    "eq.multi_step": "Multi-Step Equations",
    "eq.word_translation": "Word Problems",
    "num.mul_div_fluency": "Multiplication & Division",
    "math.rational_numbers": "Rational Numbers",
    "math.linear_equations": "Linear Equations",
    "math.quadrilaterals": "Quadrilaterals",
    "math.data_handling": "Data Handling",
    "math.squares_roots": "Squares & Square Roots",
    "sci.crop_production": "Crop Production",
    "sci.microorganisms": "Microorganisms",
    "sci.coal_petroleum": "Coal & Petroleum",
    "sci.combustion_flame": "Combustion & Flame",
    "sci.conservation": "Conservation",
    "eng.christmas_present": "The Best Christmas Present",
    "eng.tsunami": "The Tsunami",
    "eng.glimpses_past": "Glimpses of the Past",
    "eng.bepin_choudhury": "Bepin Choudhury",
    "eng.summit_within": "The Summit Within",
}


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
                (req.learner_id,),
            )
            concept_rows = cur.fetchall()

            # Get total questions attempted
            cur.execute(
                "SELECT COUNT(DISTINCT question_id) AS total FROM tutor_sessions WHERE learner_id = %s",
                (req.learner_id,),
            )
            row = cur.fetchone()
            total_q = row["total"] if row else 0

            # Get total hints used
            cur.execute(
                "SELECT COUNT(*) AS total FROM mastery_history WHERE learner_id = %s AND hint_used = true",
                (req.learner_id,),
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
    mastery_pct = round(len(mastered) / total * 100) if total else 0
    avg_p = round(sum(r["p_know"] for r in concept_rows) / total, 2)

    strong_names = [CONCEPT_FRIENDLY.get(r["concept_id"], r["concept_id"]) for r in mastered[:3]]
    weak_names = [CONCEPT_FRIENDLY.get(r["concept_id"], r["concept_id"]) for r in weak[:3]]

    parts = []
    if mastery_pct >= 70:
        parts.append(f"📈 Great progress! You've mastered {len(mastered)} of {total} concepts ({mastery_pct}%).")
    elif mastery_pct >= 40:
        parts.append(f"📊 You're making progress — {len(mastered)} of {total} concepts mastered ({mastery_pct}%). Keep going!")
    else:
        parts.append(f"📋 You've covered {total} concepts so far with {mastery_pct}% mastery.")

    parts.append(f"Questions attempted: {total_q} | Hints used: {total_hints}")

    if strong_names:
        parts.append(f"💪 Strong topics: {', '.join(strong_names)}")
    if weak_names:
        parts.append(f"🔧 Focus areas: {', '.join(weak_names)}")
    if developing:
        dev_names = [CONCEPT_FRIENDLY.get(r["concept_id"], r["concept_id"]) for r in developing[:2]]
        parts.append(f"🔄 Developing: {', '.join(dev_names)} — a few more correct answers will get you there!")

    return {
        "question_type": "am_i_on_track",
        "message": "\n".join(parts),
        "details": {
            "total_concepts": total,
            "mastered": len(mastered),
            "developing": len(developing),
            "weak": len(weak),
            "avg_mastery": avg_p,
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
        name = CONCEPT_FRIENDLY.get(top["concept_id"], top["concept_id"])
        unit = CONCEPT_UNIT_MAP.get(top["concept_id"], "the next unit")
        p = round(top["p_know"] * 100)
        return {
            "question_type": "what_to_study_next",
            "message": f"📚 I recommend focusing on **{name}** (current mastery: {p}%). Practice more questions from the \"{unit.replace('-', ' ').title()}\" unit to strengthen this concept.",
            "details": {"concept_id": top["concept_id"], "p_know": top["p_know"], "unit": unit},
        }

    # All mastered — suggest new topics
    covered_ids = {r["concept_id"] for r in concept_rows}
    uncovered = [cid for cid in CONCEPT_FRIENDLY if cid not in covered_ids]
    if subject:
        uncovered = [cid for cid in uncovered if _concept_subject(cid) == subject]

    if uncovered:
        next_cid = uncovered[0]
        name = CONCEPT_FRIENDLY.get(next_cid, next_cid)
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

    names = [CONCEPT_FRIENDLY.get(r["concept_id"], r["concept_id"]) for r in candidates[:4]]
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
