import asyncio

import httpx

from app.database import database_url
from app.main import app


def test_database_url_uses_postgresql_configuration(monkeypatch) -> None:
    expected_url = "postgresql://prism:prism_dev_only@127.0.0.1:5432/prism"
    monkeypatch.setenv("PRISM_DATABASE_URL", expected_url)

    assert database_url() == expected_url


def test_catalog_returns_grade_8_subjects_from_seeded_database(monkeypatch) -> None:
    monkeypatch.setenv(
        "PRISM_DATABASE_URL",
        "postgresql://prism:prism_dev_only@127.0.0.1:5432/prism",
    )

    async def request_catalog() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.get("/api/catalog/subjects?grade=8")

    response = asyncio.run(request_catalog())

    assert response.status_code == 200
    assert response.json() == {
        "grade": 8,
        "subjects": [
            {"slug": "mathematics", "name": "Mathematics", "unit_count": 3},
            {"slug": "science", "name": "Science", "unit_count": 3},
            {"slug": "english", "name": "English", "unit_count": 3},
        ],
    }
