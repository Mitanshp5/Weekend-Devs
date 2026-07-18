"""HTTP entrypoint for the PRISM prototype API."""

from fastapi import FastAPI, HTTPException

from app.database import concepts_for_unit, subjects_for_grade, units_for_subject

app = FastAPI(title="PRISM API", version="0.1.0")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ready"}


@app.get("/api/catalog/subjects")
def catalog_subjects(grade: int) -> dict[str, int | list[dict[str, str | int]]]:
    return {"grade": grade, "subjects": subjects_for_grade(grade)}


@app.get("/api/catalog/subjects/{subject_slug}/units")
def catalog_units(grade: int, subject_slug: str) -> dict[str, object]:
    catalog = units_for_subject(grade, subject_slug)
    if catalog is None:
        raise HTTPException(status_code=404, detail="Subject not found for this grade")
    return {"grade": grade, **catalog}


@app.get("/api/catalog/units/{unit_slug}/concepts")
def catalog_concepts(unit_slug: str) -> dict[str, object]:
    concepts = concepts_for_unit(unit_slug)
    if concepts is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return {"unit_slug": unit_slug, "concepts": concepts}
