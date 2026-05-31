# Implementation Plan

Based on the repository review and established orchestration strategy, the following steps are required to finalize the implementation of the wake-up mitigation system.

## Objective
Finalize the dual-ping keep-alive architecture to prevent sleep states on both Hugging Face Spaces and external Supabase databases, utilizing GitHub Actions as the central orchestrator.

## Implementation Steps

1. **Verify /health Endpoint:**
   - Ensure `src/spectre/main.py` explicitly mounts a `/health` endpoint that returns `HTTP 200`.
   - Ensure the endpoint checks the internal `supervisord` state if possible (e.g., local Postgres and Redis connectivity).

2. **Implement Supabase Keep-Alive Schema:**
   - Create a new Alembic migration to add the `keepalive_ping` table.
   - Define the schema: `id (UUID)`, `pinged_at (TIMESTAMP)`, `source (VARCHAR)`.
   - Apply Row Level Security (RLS) to allow inserts via the `anon` key but restrict reads.

3. **Update GitHub Actions Workflow:**
   - The current `.github/workflows/keepalive.yml` only pings Hugging Face.
   - **Task:** Update the workflow to include a secondary step that executes a `curl POST` request to the Supabase REST API (`/rest/v1/keepalive_ping`).
   - Configure the required environment variables: `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### Terminal-Based Orchestration (CLI First)

Instead of using the web dashboard, use these commands to configure the infrastructure:

#### 1. Configure GitHub Secrets via CLI
Run these commands to map your infrastructure to the orchestrator:

```powershell
# Set Hugging Face credentials
gh secret set HF_TOKEN --body "your_hf_token"

# Set Supabase credentials (for the dual-ping system)
gh secret set SUPABASE_URL --body "https://your-project.supabase.co"
gh secret set SUPABASE_ANON_KEY --body "your_anon_key"
```

#### 2. Execute RLS Configuration via psql
If you have your Supabase connection string, execute the security policy directly:

```powershell
$SQL_RLS = @"
ALTER TABLE keepalive_ping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous pings" ON keepalive_ping FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Restrict selection" ON keepalive_ping FOR SELECT TO authenticated USING (true);
"@

# Execute via psql (replace with your actual connection string)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" -c "$SQL_RLS"
```

#### 3. Run Alembic Migrations Locally
Apply the heartbeat schema to the remote database:

```powershell
# Update your local .env or set temporary env var
$env:DATABASE_URL="postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
python -m alembic upgrade head
```

4. **Testing & Verification:**
   - Trigger the GitHub Action manually (`workflow_dispatch`).
   - Verify the HF Space `/health` responds with `200`.
   - Verify the Supabase `keepalive_ping` table receives a new row.

## Migration & Rollback Strategy

- **Migration:** Safe to deploy. The GitHub Action runs in isolation and does not interfere with the core application logic. The new database table is isolated.
- **Rollback:** If the workflow fails, simply remove the `cron` trigger from `keepalive.yml` or delete the file entirely. The `keepalive_ping` table can be dropped without affecting tenant data.