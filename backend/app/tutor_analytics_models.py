"""Tutor Analytics database-table initialization.

Learner evidence, tutoring sessions, and cohort analytics are persisted only from
real API activity. This module never creates fabricated learner records.
"""

from __future__ import annotations

from app.database import initialize_database


def initialize_tutor_analytics_tables() -> None:
    """Create Tutor Analytics tables if they do not exist (idempotent)."""
    initialize_database()
