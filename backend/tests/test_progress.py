"""Tests for Tutor Analytics progress evidence endpoints."""

import asyncio
import os

import httpx

from app.main import app as tutor_analytics_app
from tests.tutor_analytics_fixtures import seed_tutor_analytics_data

DATABASE_URL = os.getenv(
    "PRISM_DATABASE_URL",
    "postgresql://prism:prism_dev_only@127.0.0.1:5432/prism",
)


def request(path: str) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=tutor_analytics_app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(path)
    return asyncio.run(send())


def setup_module():
    os.environ.setdefault("PRISM_DATABASE_URL", DATABASE_URL)
    seed_tutor_analytics_data()


def test_progress_returns_concepts_for_learner(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/progress/test-learner-1")
    assert resp.status_code == 200
    body = resp.json()
    assert body["learner_id"] == "test-learner-1"
    assert len(body["concepts"]) >= 1
    concept = body["concepts"][0]
    assert "p_know" in concept
    assert "band" in concept
    assert "learner_message" in concept
    assert "teacher_message" in concept


def test_progress_returns_band_classification(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/progress/student-04")
    assert resp.status_code == 200
    body = resp.json()
    # student-04 has p_know >= 0.70 with 5 independent correct on inverse_ops
    high_mastery = [c for c in body["concepts"] if c["concept_id"] == "eq.inverse_operations"]
    if high_mastery:
        assert high_mastery[0]["band"] == "ready_for_extension"


def test_progress_evidence_timeline(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/progress/test-learner-2/concept/eq.inverse_operations")
    assert resp.status_code == 200
    body = resp.json()
    assert body["concept_id"] == "eq.inverse_operations"
    assert len(body["timeline"]) >= 2
    # Timeline should be in chronological order
    timestamps = [entry["created_at"] for entry in body["timeline"]]
    assert timestamps == sorted(timestamps)


def test_progress_200_for_unknown_learner(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/progress/nonexistent-student")
    assert resp.status_code == 200
    body = resp.json()
    assert body["learner_id"] == "nonexistent-student"
    assert body["concepts"] == []


def test_progress_404_for_unknown_concept(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/progress/test-learner-1/concept/nonexistent.concept")
    assert resp.status_code == 404
