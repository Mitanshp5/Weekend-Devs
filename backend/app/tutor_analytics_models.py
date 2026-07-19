"""Tutor Analytics database tables and seed helpers for PRISM.

Creates tables for tutor sessions, mastery history, teacher summaries,
and misconception clusters. Designed to co-exist alongside the existing
curriculum/catalog tables without modifying them.
"""

from __future__ import annotations

from app.database import connect, initialize_database, seed_tutor_analytics_data


def initialize_tutor_analytics_tables() -> None:
    """Create Tutor Analytics tables if they do not exist (idempotent)."""
    initialize_database()  # core initialize_database now handles base + tutor analytics tables
