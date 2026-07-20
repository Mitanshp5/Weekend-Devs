"""Compatibility hook for Tutor Analytics table setup.

Schema creation and approved development seeding are launcher responsibilities:
`setup.*` and `run-dev.*` call `app.database.initialize_database()` before API
processes start. Request handlers must not initialize or seed the database.
"""

from __future__ import annotations


def initialize_tutor_analytics_tables() -> None:
    """Retained for existing callers; initialization happens before app startup."""
    return None
