"""Tests for Tutor Analytics teacher dashboard endpoints."""

import asyncio
import os

import httpx

from app.main import app as tutor_analytics_app
from app.tutor_analytics_models import seed_tutor_analytics_data

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
    seed_tutor_analytics_data(force=True)


def test_cohort_returns_band_distribution(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/teacher/cohort?grade=8")
    assert resp.status_code == 200
    body = resp.json()
    assert body["grade"] == 8
    assert body["total_learners"] >= 5
    assert "band_distribution" in body
    assert isinstance(body["band_distribution"], dict)


def test_cohort_returns_clusters_ranked_by_impact(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/teacher/cohort?grade=8")
    body = resp.json()
    clusters = body["top_clusters"]
    assert len(clusters) >= 1
    # Check descending impact_score order
    scores = [c["impact_score"] for c in clusters]
    assert scores == sorted(scores, reverse=True)


def test_cohort_returns_intervention_recommendations(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/teacher/cohort?grade=8")
    body = resp.json()
    recs = body["intervention_recommendations"]
    assert len(recs) >= 1
    assert "recommended_action" in recs[0]


def test_student_card_returns_full_data(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/teacher/student/student-02")
    assert resp.status_code == 200
    body = resp.json()
    assert body["learner_id"] == "student-02"
    assert body["likely_blocker_concept"] == "eq.inverse_operations"
    assert body["blocker_confidence"] == 0.78
    assert body["recommended_action"] is not None


def test_student_card_404_for_unknown(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/teacher/student/nonexistent")
    assert resp.status_code == 404


def test_clusters_endpoint_returns_ranked_list(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/teacher/clusters?grade=8")
    assert resp.status_code == 200
    body = resp.json()
    assert body["grade"] == 8
    assert len(body["clusters"]) >= 3
    scores = [c["impact_score"] for c in body["clusters"]]
    assert scores == sorted(scores, reverse=True)


def test_clusters_include_suggested_intervention(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("/api/teacher/clusters?grade=8")
    body = resp.json()
    for cluster in body["clusters"]:
        assert "suggested_intervention" in cluster
        assert cluster["suggested_intervention"] is not None
