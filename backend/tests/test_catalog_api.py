import asyncio
import os

import httpx

from app.database import database_url
from app.main import app


def request(path: str) -> httpx.Response:
    async def send_request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get(path)

    return asyncio.run(send_request())


def test_database_url_uses_postgresql_configuration(monkeypatch) -> None:
    test_url = "postgresql://prism:prism_dev_only@127.0.0.1:5432/prism_custom"
    monkeypatch.setenv("PRISM_DATABASE_URL", test_url)

    assert database_url() == test_url


def test_catalog_returns_full_grade_8_subjects_from_seeded_database() -> None:
    response = request("/api/catalog/subjects?grade=8")

    assert response.status_code == 200
    assert response.json() == {
        "grade": 8,
        "subjects": [
            {"slug": "mathematics", "name": "Mathematics", "unit_count": 13},
            {"slug": "science", "name": "Science", "unit_count": 13},
            {"slug": "english", "name": "English", "unit_count": 8},
        ],
    }


def test_catalog_returns_source_linked_units_and_concepts() -> None:
    response = request("/api/catalog/subjects/mathematics/units?grade=8")

    assert response.status_code == 200
    body = response.json()
    assert body["subject"] == {"slug": "mathematics", "name": "Mathematics"}
    assert len(body["units"]) == 13
    assert body["units"][0] == {
        "slug": "rational-numbers",
        "name": "Rational Numbers",
        "position": 1,
        "concept_count": 3,
    }


def test_catalog_returns_concepts_for_a_unit() -> None:
    response = request("/api/catalog/units/rational-numbers/concepts")

    assert response.status_code == 200
    assert [concept["name"] for concept in response.json()["concepts"]] == [
        "Representing rational numbers",
        "Operations on rational numbers",
        "Rational numbers on a number line",
    ]

