"""Health check router — includes DB, Redis, and ML model status."""

from __future__ import annotations

import datetime

from fastapi import APIRouter, Request

from fastapi.responses import HTMLResponse

router = APIRouter(tags=["Health"])


@router.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with basic UI for testing."""
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spectre API | Auth Test</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f7f9; }
            .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 90%; }
            h1 { color: #1a1f36; margin-bottom: 0.5rem; font-size: 1.8rem; }
            p { color: #4f566b; margin-bottom: 2rem; line-height: 1.5; }
            .btn-google { 
                display: flex; align-items: center; justify-content: center; 
                background-color: #fff; color: #3c4043; border: 1px solid #dadce0; 
                padding: 10px 24px; border-radius: 4px; font-weight: 500; cursor: pointer;
                text-decoration: none; transition: background-color .2s, box-shadow .2s;
                font-size: 14px;
            }
            .btn-google:hover { background-color: #f8f9fa; box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15); }
            .btn-google img { width: 18px; height: 18px; margin-right: 12px; }
            .footer { margin-top: 2rem; font-size: 12px; color: #a3acb9; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Spectre API</h1>
            <p>Internal backend authentication verification portal.</p>
            
            <a href="/api/v1/auth/oauth/google" class="btn-google">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" alt="Google">
                Sign in with Google
            </a>

            <div class="footer">
                Ready for Frontend Handoff &bull; v0.1.0
            </div>
        </div>
    </body>
    </html>
    """


@router.get("/health", response_model=None)
async def health_check(request: Request) -> dict:
    """Application health check endpoint with component status."""
    components = {}

    # Database health
    try:
        db_factory = getattr(request.app.state, "db_session_factory", None)
        if db_factory:
            from sqlalchemy import text

            async with db_factory() as session:
                await session.execute(text("SELECT 1"))
            components["database"] = "healthy"
        else:
            components["database"] = "not_initialized"
    except Exception:
        components["database"] = "unhealthy"

    # Redis health
    try:
        redis = getattr(request.app.state, "redis", None)
        if redis and await redis.ping():
            components["redis"] = "healthy"
        else:
            components["redis"] = "not_initialized"
    except Exception:
        components["redis"] = "unhealthy"

    # ML model health
    registry = getattr(request.app.state, "model_registry", None)
    components["ml_model"] = "loaded" if registry is not None else "not_loaded"

    overall = "healthy" if all(
        v in ("healthy", "loaded") for v in components.values()
    ) else "degraded"

    return {
        "status": overall,
        "service": "spectre-api",
        "version": "0.1.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "components": components,
    }
