"""Tutor Analytics API router — mounts tutor, progress, and teacher endpoints.

Import this router and include it in the FastAPI app to activate all
Tutor Analytics endpoints without modifying any existing route file.

Usage (one-line addition to main.py or a separate startup script):
    from app.tutor_analytics_router import tutor_analytics_app
    app.mount("", tutor_analytics_app)
"""

from __future__ import annotations

from fastapi import FastAPI

from app.progress import router as progress_router
from app.teacher import router as teacher_router
from app.tutor import router as tutor_router

tutor_analytics_app = FastAPI(title="PRISM Tutor Analytics API", version="0.1.0")
tutor_analytics_app.include_router(progress_router)
tutor_analytics_app.include_router(teacher_router)
tutor_analytics_app.include_router(tutor_router)
