# Infrastructure Architecture Review

## Current Deployment Structure

The Spectre application employs a "monolithic container" strategy designed specifically to run on Hugging Face Spaces using the Docker SDK.

1.  **Single Container Lifecycle:** Hugging Face Spaces provides a single Docker container environment. To satisfy the requirements of the Spectre application, the `Dockerfile` installs and bundles PostgreSQL, Redis, FastAPI (via Uvicorn), and Celery.
2.  **Process Management:** `supervisord.conf` handles the lifecycle of these internal services:
    *   **Priority 10:** PostgreSQL
    *   **Priority 20:** Redis
    *   **Priority 30:** FastAPI
    *   **Priority 40:** Celery Worker
3.  **Initialization:** The `start.sh` entrypoint initializes the PostgreSQL database (if running for the first time), applies Alembic migrations, seeds the database, and then launches `supervisord`.

## Inactivity Constraints & Risks

Because all services run inside a single container on HF Spaces, the infrastructure inherits the platform's sleep behavior:
*   **Hugging Face Spaces:** Pauses the container after 48 hours of inactivity. When paused, the container state is lost, and the initialization script (`start.sh`) will run again upon wake-up. While PostgreSQL data is preserved via persistent volumes (if configured, though HF basic tier usually has ephemeral disks unless upgraded), the process of waking up ("Cold Start") can take several minutes.
*   **Supabase (Optional/External DB):** Free-tier projects are paused after 7 days of inactivity. Restoring a paused project requires manual intervention from the Supabase dashboard.

## Architectural Trade-offs

*   **Coupled vs. Decoupled:** By running Postgres and Redis inside the HF Space, the system minimizes external dependencies. A single ping to the FastAPI `/health` endpoint keeps the entire stack warm. However, if the HF Space is restarted, the ephemeral local database might be wiped (unless persistent storage is purchased).
*   **External Supabase:** Waking up the HF Space is not enough if it relies on an external Supabase database that has been paused. A comprehensive orchestration strategy must ping both systems to maintain synchronization.