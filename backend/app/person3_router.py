"""Person 3 API router — mounts tutor, progress, and teacher endpoints.

Import this router and include it in the FastAPI app to activate all
Person 3 endpoints without modifying any existing route file.

Usage (one-line addition to main.py or a separate startup script):
    from app.person3_router import person3_app
    app.mount("", person3_app)
"""

from __future__ import annotations

from fastapi import FastAPI

from app.progress import router as progress_router
from app.teacher import router as teacher_router
from app.tutor import router as tutor_router

person3_app = FastAPI(title="PRISM Person 3 API", version="0.1.0")
person3_app.include_router(progress_router)
person3_app.include_router(teacher_router)
person3_app.include_router(tutor_router)
