"""Explainable Bayesian Knowledge Tracing update for one learner-concept pair."""

LEARN_TRANSITION = 0.12
SLIP = 0.08
GUESS = 0.20


def update_mastery(prior_knowledge: float, is_correct: bool) -> float:
    """Return the next probability that a learner knows a concept.

    The fixed parameters are explicit prototype assumptions. They are not a
    trained model and will be calibrated only after collecting consented data.
    """
    if not 0.0 <= prior_knowledge <= 1.0:
        raise ValueError("prior_knowledge must be between 0 and 1")

    if is_correct:
        numerator = prior_knowledge * (1.0 - SLIP)
        denominator = numerator + (1.0 - prior_knowledge) * GUESS
    else:
        numerator = prior_knowledge * SLIP
        denominator = numerator + (1.0 - prior_knowledge) * (1.0 - GUESS)

    posterior = numerator / denominator
    return posterior + (1.0 - posterior) * LEARN_TRANSITION
