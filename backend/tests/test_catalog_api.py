import asyncio

import httpx

from app.main import app


def test_catalog_returns_grade_8_subjects_from_seeded_database() -> None:
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
