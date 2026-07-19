"""Tutor orchestrator for PRISM (Person 3).

Implements the four-mode Socratic escalation ladder with a deterministic
authored-content fallback.  The LLM path is stubbed — the fallback path
works offline and is the primary tested path.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import connect
from app.person3_models import initialize_person3_tables

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


# ---------------------------------------------------------------------------
# Authored question bank for the Linear Equations topic
# (In production this would come from the curriculum registry)
# ---------------------------------------------------------------------------

QUESTION_BANK: dict[str, dict[str, Any]] = {
    "q.eq.01": {
        "id": "q.eq.01",
        "concept_id": "num.signed_operations",
        "difficulty": 0.30,
        "prompt": "Simplify: −4 + (−3)",
        "answer_type": "numeric",
        "expected_answer": "-7",
        "solution_steps": ["Combine the two negative numbers", "−4 + (−3) = −7"],
        "rubric": [
            {"pattern": "7", "error_tag": "eq.sign_not_transferred", "confidence": 1.0},
            {"pattern": "-1", "error_tag": "num.subtraction_confusion", "confidence": 0.9},
        ],
        "hint_ladder": [
            "Both numbers have the same sign. What happens when you add two negatives?",
            "Think of it on a number line: you start at −4 and move 3 more steps to the left.",
            "−4 + (−3) means adding their magnitudes (4 + 3 = 7) and keeping the negative sign.",
        ],
        "feedback": {
            "correct": "That's right — two negatives add to a larger negative.",
            "eq.sign_not_transferred": "You found the right magnitude but lost the sign. Both numbers are negative, so the sum is also negative.",
            "num.subtraction_confusion": "It looks like you subtracted instead of adding. When both numbers are negative, add their magnitudes.",
        },
    },
    "q.eq.02": {
        "id": "q.eq.02",
        "concept_id": "eq.inverse_operations",
        "difficulty": 0.45,
        "prompt": "Solve: x + 5 = 12",
        "answer_type": "numeric",
        "expected_answer": "7",
        "solution_steps": ["Subtract 5 from both sides", "x = 12 − 5 = 7"],
        "rubric": [
            {"pattern": "17", "error_tag": "eq.added_instead_of_subtracted", "confidence": 1.0},
        ],
        "hint_ladder": [
            "What operation would undo adding 5?",
            "To isolate x, subtract 5 from both sides of the equation.",
            "x + 5 − 5 = 12 − 5. What do you get?",
        ],
        "feedback": {
            "correct": "Correct! Subtracting 5 from both sides isolates x.",
            "eq.added_instead_of_subtracted": "You added 5 instead of subtracting. The inverse of +5 is −5.",
        },
    },
    "q.eq.03": {
        "id": "q.eq.03",
        "concept_id": "eq.inverse_operations",
        "difficulty": 0.52,
        "prompt": "Solve: 3x − 5 = 16",
        "answer_type": "numeric",
        "expected_answer": "7",
        "solution_steps": ["Add 5 to both sides", "Divide both sides by 3"],
        "rubric": [
            {"pattern": "11", "error_tag": "eq.stops_before_division", "confidence": 1.0},
            {"pattern": "-7", "error_tag": "eq.sign_not_transferred", "confidence": 1.0},
        ],
        "hint_ladder": [
            "What must happen to both sides before x can be isolated?",
            "First undo subtracting 5. What equation do you get?",
            "Now 3 is multiplying x. What is the inverse operation?",
        ],
        "feedback": {
            "correct": "Correct: you used inverse operations in the right order.",
            "eq.stops_before_division": "You correctly removed 5, but x is still multiplied by 3.",
            "eq.sign_not_transferred": "Check the sign: subtracting 5 vs adding 5 changes the result.",
        },
    },
    "q.eq.04": {
        "id": "q.eq.04",
        "concept_id": "eq.multi_step",
        "difficulty": 0.65,
        "prompt": "Solve: 2(x − 3) = 14",
        "answer_type": "numeric",
        "expected_answer": "10",
        "solution_steps": [
            "Divide both sides by 2: x − 3 = 7",
            "Add 3 to both sides: x = 10",
        ],
        "rubric": [
            {"pattern": "7", "error_tag": "eq.stops_before_adding", "confidence": 1.0},
            {"pattern": "4", "error_tag": "eq.wrong_distribution", "confidence": 0.9},
        ],
        "hint_ladder": [
            "How can you simplify the left side? What's being multiplied by 2?",
            "Divide both sides by 2 first. What do you get?",
            "After simplifying, you have x − 3 = 7. What's the last step?",
        ],
        "feedback": {
            "correct": "Well done — you kept both operations in the right order.",
            "eq.stops_before_adding": "You divided correctly but forgot to undo the −3.",
            "eq.wrong_distribution": "Check your distribution — divide the whole right side by 2, not just part.",
        },
    },
    "q.eq.05": {
        "id": "q.eq.05",
        "concept_id": "eq.word_translation",
        "difficulty": 0.78,
        "prompt": "A number is 5 more than twice another number. If their sum is 35, find the numbers.",
        "answer_type": "numeric",
        "expected_answer": "10",
        "solution_steps": [
            "Let the smaller number be x",
            "The larger number is 2x + 5",
            "x + (2x + 5) = 35",
            "3x + 5 = 35",
            "3x = 30",
            "x = 10",
        ],
        "rubric": [
            {"pattern": "25", "error_tag": "eq.wrong_variable_assignment", "confidence": 0.8},
            {"pattern": "15", "error_tag": "eq.stops_before_division", "confidence": 0.7},
        ],
        "hint_ladder": [
            "Can you write the relationship between the two numbers as an equation?",
            "Let x = the smaller number. How would you express '5 more than twice x'?",
            "The equation is: x + (2x + 5) = 35. Can you simplify?",
        ],
        "feedback": {
            "correct": "Excellent — you translated the words into algebra correctly.",
            "eq.wrong_variable_assignment": "Check which number you called x — the problem says 'twice another number'.",
            "eq.stops_before_division": "You simplified correctly but stopped before dividing by 3.",
        },
    },
}


# ---------------------------------------------------------------------------
# Escalation ladder
# ---------------------------------------------------------------------------

MODE_LADDER = [
    "socratic_hint",
    "explain_error",
    "worked_step",
    "direct_explanation",
    "check_thinking",
]


def _mode_for_attempt(attempt_number: int) -> str:
    """Return the tutor mode for a given attempt number."""
    if attempt_number <= 0:
        return "socratic_hint"
    if attempt_number == 1:
        return "explain_error"
    if attempt_number == 2:
        return "worked_step"
    return "direct_explanation"


# ---------------------------------------------------------------------------
# Fallback (deterministic, no LLM)
# ---------------------------------------------------------------------------

def _fallback_response(
    question: dict[str, Any],
    attempt_number: int,
    error_tag: str | None = None,
) -> dict[str, Any]:
    """Build a deterministic tutor response from authored content."""
    mode = _mode_for_attempt(attempt_number)
    hints = question["hint_ladder"]
    feedback = question.get("feedback", {})
    solution_steps = question.get("solution_steps", [])

    if mode == "socratic_hint":
        message = hints[0] if hints else "Think about what operation to use."
    elif mode == "explain_error":
        # Use specific feedback for the error tag if available
        if error_tag and error_tag in feedback:
            message = feedback[error_tag]
        elif len(hints) > 1:
            message = hints[1]
        else:
            message = hints[0] if hints else "Try again — check each step."
    elif mode == "worked_step":
        if len(hints) > 2:
            message = hints[2]
        elif solution_steps:
            message = "Step by step: " + " → ".join(solution_steps)
        else:
            message = hints[-1] if hints else "Review the concept card."
    else:  # direct_explanation
        if solution_steps:
            message = "Here's the full solution: " + " → ".join(solution_steps)
        else:
            message = feedback.get("correct", "Review the concept card for the full explanation.")

    return {
        "response_mode": mode,
        "message": message,
        "concept_ids": [question["concept_id"]],
        "citation_ids": [question["id"]],
        "confidence": "high" if mode == "direct_explanation" else "medium",
        "next_action": (
            "show_transfer_question" if mode == "direct_explanation"
            else "await_learner_attempt"
        ),
        "safety_flags": [],
        "is_fallback": True,
    }


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------

class TutorRequest(BaseModel):
    learner_id: str
    question_id: str
    attempt_number: int = 0
    learner_answer: str | None = None
    error_tag: str | None = None


@router.get("/fallback/{question_id}")
def get_fallback(question_id: str, attempt: int = 0, error_tag: str | None = None) -> dict:
    """Return the authored deterministic tutor response (no LLM)."""
    question = QUESTION_BANK.get(question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return _fallback_response(question, attempt, error_tag)


@router.post("/respond")
def tutor_respond(req: TutorRequest) -> dict:
    """Full tutor response — uses deterministic fallback.

    In a production system, this would try the LLM first and fall back
    to authored content on failure.  For the prototype, the deterministic
    path is the primary path (non-negotiable #2).
    """
    question = QUESTION_BANK.get(req.question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    response = _fallback_response(question, req.attempt_number, req.error_tag)

    # Persist the tutor session
    initialize_person3_tables()
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO tutor_sessions
                    (learner_id, question_id, attempt_number, response_mode,
                     message, concept_ids, citation_ids, confidence,
                     next_action, is_fallback)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    req.learner_id,
                    req.question_id,
                    req.attempt_number,
                    response["response_mode"],
                    response["message"],
                    response["concept_ids"],
                    response["citation_ids"],
                    response["confidence"],
                    response["next_action"],
                    response["is_fallback"],
                ),
            )

    return response


@router.get("/questions")
def list_questions() -> dict:
    """Return all available questions in the tutor question bank."""
    return {
        "questions": [
            {
                "id": q["id"],
                "concept_id": q["concept_id"],
                "prompt": q["prompt"],
                "difficulty": q["difficulty"],
            }
            for q in QUESTION_BANK.values()
        ]
    }
