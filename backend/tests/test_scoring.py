from app.scoring import score_numeric_answer


def test_scores_equivalent_numeric_answers_as_correct() -> None:
    result = score_numeric_answer(submitted=" 7.0 ", expected="7")

    assert result.is_correct is True
    assert result.normalized_answer == "7"
    assert result.error_tag is None


def test_tags_known_misconception_for_incorrect_answer() -> None:
    result = score_numeric_answer(
        submitted="11",
        expected="7",
        misconception_map={"11": "eq.stops_before_division"},
    )

    assert result.is_correct is False
    assert result.error_tag == "eq.stops_before_division"
