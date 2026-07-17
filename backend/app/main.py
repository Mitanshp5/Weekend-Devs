"""HTTP entrypoint for the PRISM prototype API."""

from fastapi import FastAPI

app = FastAPI(title="PRISM API", version="0.1.0")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ready"}
