import os
import time
import traceback
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.flowwatch_sdk import AsyncFlowwatchClient

FLOWWATCH_URL = os.getenv("FLOWWATCH_URL", "http://localhost:9400")
FLOWWATCH_TOKEN = os.getenv("FLOWWATCH_TOKEN", "")

# Global Flowwatch Async Client
client = AsyncFlowwatchClient(FLOWWATCH_URL, token=FLOWWATCH_TOKEN or None)

class FlowwatchMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        method = request.method
        span_name = f"{method} {path}"

        # Bypass internal health check / OpenAPI docs
        if path == "/api/health" or path.startswith("/docs") or path.startswith("/openapi.json"):
            return await call_next(request)

        start_time = time.monotonic()
        status = "ok"
        try:
            response: Response = await call_next(request)
            if response.status_code >= 400:
                status = "error"
            return response
        except Exception as e:
            status = "error"
            stack = traceback.format_exc()
            try:
                await client.capture_error(
                    message=str(e),
                    name=e.__class__.__name__,
                    stack=stack,
                    source="fastapi-backend",
                    path=path,
                    method=method
                )
            except Exception as fw_err:
                print(f"[FlowWatch Error Capture Failed] {fw_err}")
            raise e
        finally:
            duration_ms = (time.monotonic() - start_time) * 1000
            try:
                await client.log_trace_span(
                    name=span_name,
                    type="http",
                    duration_ms=duration_ms,
                    status=status,
                    metadata={"path": path, "method": method}
                )
            except Exception as fw_err:
                print(f"[FlowWatch Trace Logging Failed] {fw_err}")


async def evaluate_flag(key: str, context: dict[str, Any] | None = None) -> bool:
    """Evaluate a feature flag through the FlowWatch sidecar."""
    try:
        return await client.evaluate_flag(key, context)
    except Exception as e:
        print(f"[FlowWatch Flag Error] {e}")
        return False


async def capture_exception(
    e: Exception, source: str = "fastapi-backend", metadata: dict[str, Any] | None = None
) -> None:
    """Manually report an exception to FlowWatch."""
    try:
        stack = traceback.format_exc()
        await client.capture_error(
            message=str(e),
            name=e.__class__.__name__,
            stack=stack,
            source=source,
            **(metadata or {})
        )
    except Exception as fw_err:
        print(f"[FlowWatch Capture Error Failed] {fw_err}")


async def log_trace_span(
    name: str,
    span_type: str = "db",
    duration_ms: float = 0.0,
    status: str = "ok",
    metadata: dict[str, Any] | None = None,
) -> None:
    """Submit a trace span to FlowWatch."""
    try:
        await client.log_trace_span(
            name=name,
            type=span_type,
            duration_ms=duration_ms,
            status=status,
            metadata=metadata
        )
    except Exception as fw_err:
        print(f"[FlowWatch Log Trace Failed] {fw_err}")


async def trigger_workflow(name: str, input_data: Any = None) -> dict[str, Any] | None:
    """Trigger a FlowWatch durable workflow."""
    try:
        return await client.trigger_workflow(name, input_data)
    except Exception as fw_err:
        print(f"[FlowWatch Trigger Workflow Failed] {fw_err}")
        return None


@asynccontextmanager
async def trace_operation(
    name: str, span_type: str = "custom", metadata: dict[str, Any] | None = None
) -> AsyncGenerator[None, None]:
    """Async context manager to automatically measure execution time and submit a span to FlowWatch."""
    start_time = time.monotonic()
    status = "ok"
    try:
        yield
    except Exception as e:
        status = "error"
        await capture_exception(e, source=f"operation:{name}", metadata=metadata)
        raise e
    finally:
        duration_ms = (time.monotonic() - start_time) * 1000
        await log_trace_span(
            name=name,
            span_type=span_type,
            duration_ms=duration_ms,
            status=status,
            metadata=metadata
        )
