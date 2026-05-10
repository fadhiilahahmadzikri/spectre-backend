"""Health check router — includes DB, Redis, and ML model status."""

from __future__ import annotations

import datetime

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy import text
from fastapi.responses import HTMLResponse

from spectre.interface.dependencies import get_current_user
from spectre.domain.entities.user import User

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


from pydantic import BaseModel
from typing import Literal

class DBConfigRequest(BaseModel):
    target: Literal["supabase", "alpine"]


@router.get("/admin/stats")
async def get_admin_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """Protected endpoint for admin to view infrastructure stats."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # Get latest heartbeats
    heartbeats = []
    try:
        db_factory = getattr(request.app.state, "db_session_factory", None)
        if db_factory:
            async with db_factory() as session:
                heartbeat_query = text(
                    "SELECT id, pinged_at, source FROM keepalive_ping "
                    "ORDER BY pinged_at DESC LIMIT 5"
                )
                result = await session.execute(heartbeat_query)
                heartbeats = [
                    {
                        "id": str(row.id),
                        "pinged_at": row.pinged_at.isoformat(),
                        "source": row.source,
                    }
                    for row in result.all()
                ]
    except Exception:
        pass

    # Extract active db string from configuration
    db_url = str(getattr(request.app.state.settings, "database_url", ""))
    if "supabase" in db_url:
        active_db = "supabase"
    else:
        active_db = "alpine"

    return {
        "heartbeats": heartbeats,
        "server_time": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "active_db": active_db
    }


@router.post("/admin/config/db")
async def switch_db(
    request: Request,
    body: DBConfigRequest,
    current_user: User = Depends(get_current_user)
):
    """Dynamically switch database connection environment."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Simulate DB switch orchestration (updates configuration files and triggers restart)
    import asyncio
    
    # In a real environment, you'd modify .env or Hugging Face secrets.
    # We will simulate the latency of an orchestration sync.
    await asyncio.sleep(2)
    
    # Modify the active setting in memory just for simulation.
    if body.target == "supabase":
        request.app.state.settings.database_url = "postgresql+asyncpg://postgres:xxx@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    else:
        request.app.state.settings.database_url = "postgresql+asyncpg://spectre:spectre@localhost:5432/spectre"
    
    return {"status": "success", "message": f"Database switched to {body.target}"}


@router.get("/admin/env")
async def get_admin_env(
    current_user: User = Depends(get_current_user),
):
    """Protected endpoint to audit active environment variables."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    # List of keys we want to audit (avoiding extremely sensitive ones if preferred, 
    # but since it's admin-only, we can show what's needed).
    keys_to_audit = [
        "APP_NAME", "APP_ENV", "DATABASE_URL", "REDIS_URL", 
        "API_PORT", "MODEL_PATH", "HF_SPACE_ID", "SMTP_HOST"
    ]
    
    # Also include any key that looks like a Spectre config
    audit_data = {k: os.environ.get(k, "NOT SET") for k in os.environ.keys() if any(x in k for x in ["DATABASE", "JWT", "SECRET", "KEY", "URL", "SMTP"])}
    
    # Supplement with explicitly requested keys
    for k in keys_to_audit:
        if k not in audit_data:
            audit_data[k] = os.environ.get(k, "NOT SET")

    return audit_data
