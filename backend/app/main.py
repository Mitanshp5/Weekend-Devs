"""HTTP entrypoint for the PRISM prototype API."""

from fastapi import FastAPI

from app.database import subjects_for_grade

app = FastAPI(title="PRISM API", version="0.1.0")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ready"}


@app.get("/api/catalog/subjects")
def catalog_subjects(grade: int) -> dict[str, int | list[dict[str, str | int]]]:
    return {"grade": grade, "subjects": subjects_for_grade(grade)}
