"""Deterministic answer-scoring utilities for PRISM."""

from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Mapping


@dataclass(frozen=True)
class ScoreResult:
    is_correct: bool
    normalized_answer: str
    error_tag: str | None = None


def _normalize_numeric(value: str) -> str:
    try:
        normalized = Decimal(value.strip())
    except InvalidOperation:
        return value.strip()

    return format(normalized.normalize(), "f").rstrip("0").rstrip(".") or "0"


def score_numeric_answer(
    submitted: str,
    expected: str,
    misconception_map: Mapping[str, str] | None = None,
) -> ScoreResult:
    normalized_submitted = _normalize_numeric(submitted)
    normalized_expected = _normalize_numeric(expected)
    is_correct = normalized_submitted == normalized_expected
    error_tag = None
    if not is_correct and misconception_map is not None:
        error_tag = misconception_map.get(normalized_submitted)

    return ScoreResult(
        is_correct=is_correct,
        normalized_answer=normalized_submitted,
        error_tag=error_tag,
    )
