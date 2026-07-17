import pytest

from app.mastery import update_mastery


def test_correct_independent_attempt_increases_mastery() -> None:
    updated = update_mastery(prior_knowledge=0.35, is_correct=True)

    assert updated > 0.35
    assert updated < 1.0


def test_mastery_rejects_probability_outside_unit_interval() -> None:
    with pytest.raises(ValueError, match="between 0 and 1"):
        update_mastery(prior_knowledge=1.1, is_correct=True)
