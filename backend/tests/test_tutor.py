"""Tests for Person 3 tutor orchestrator endpoints."""

import asyncio
import os

import httpx

from app.person3_router import person3_app
from app.person3_models import seed_person3_data

DATABASE_URL = os.getenv(
    "PRISM_DATABASE_URL",
    "postgresql://prism:prism_dev_only@127.0.0.1:5432/prism",
)


def request(method: str, path: str, **kwargs) -> httpx.Response:
    async def send() -> httpx.Response:
        transport = httpx.ASGITransport(app=person3_app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await getattr(client, method)(path, **kwargs)
    return asyncio.run(send())


def setup_module():
    os.environ.setdefault("PRISM_DATABASE_URL", DATABASE_URL)
    seed_person3_data()


# -- Fallback tests --

def test_tutor_fallback_returns_socratic_hint_for_attempt_0(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("get", "/api/tutor/fallback/q.eq.03?attempt=0")
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "socratic_hint"
    assert body["is_fallback"] is True
    assert "concept_ids" in body
    assert len(body["concept_ids"]) > 0


def test_tutor_fallback_escalates_to_explain_error_on_attempt_1(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request(
        "get",
        "/api/tutor/fallback/q.eq.03?attempt=1&error_tag=eq.stops_before_division",
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "explain_error"


def test_tutor_fallback_escalates_to_worked_step_on_attempt_2(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("get", "/api/tutor/fallback/q.eq.03?attempt=2")
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "worked_step"


def test_tutor_fallback_gives_direct_explanation_on_attempt_3(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("get", "/api/tutor/fallback/q.eq.03?attempt=3")
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "direct_explanation"
    assert body["next_action"] == "show_transfer_question"


def test_tutor_fallback_404_for_unknown_question(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("get", "/api/tutor/fallback/q.nonexistent?attempt=0")
    assert resp.status_code == 404


# -- POST /tutor/respond tests --

def test_tutor_respond_persists_session(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request(
        "post",
        "/api/tutor/respond",
        json={
            "learner_id": "test-student-99",
            "question_id": "q.eq.02",
            "attempt_number": 0,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "socratic_hint"
    assert body["is_fallback"] is True


# -- Questions list --

def test_tutor_lists_available_questions(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    resp = request("get", "/api/tutor/questions")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["questions"]) >= 5


# -- Answer validation and hint requests tests --

def test_tutor_respond_correct_answer(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    # Question q.eq.03 expected is "7"
    resp = request(
        "post",
        "/api/tutor/respond",
        json={
            "learner_id": "test-student-99",
            "question_id": "q.eq.03",
            "attempt_number": 0,
            "learner_answer": "7",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "check_thinking"
    assert body["is_correct"] is True
    assert body["next_action"] == "show_transfer_question"


def test_tutor_respond_incorrect_answer(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    # Question q.eq.03 expected is "7". Throwing in "-7" mapping to eq.sign_not_transferred
    resp = request(
        "post",
        "/api/tutor/respond",
        json={
            "learner_id": "test-student-99",
            "question_id": "q.eq.03",
            "attempt_number": 0,
            "learner_answer": "-7",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "explain_error"  # escalates to climb level 1
    assert body["is_correct"] is False
    assert body["error_tag"] == "eq.sign_not_transferred"


def test_tutor_respond_direct_hint_request(monkeypatch):
    monkeypatch.setenv("PRISM_DATABASE_URL", DATABASE_URL)
    # No learner_answer provided
    resp = request(
        "post",
        "/api/tutor/respond",
        json={
            "learner_id": "test-student-99",
            "question_id": "q.eq.03",
            "attempt_number": 2,
            "learner_answer": "",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["response_mode"] == "worked_step"
    assert body["is_correct"] is False

