# Mitigation Strategy & Research

## The Engineering Challenge

Deploying lightweight backend services on free-tier platforms introduces instability when the infrastructure enters an inactive state. The goal is to implement **proactive continuity engineering** to prevent sleep states, rather than reactive recovery engineering.

## Strategies Evaluated

### 1. Hugging Face Space Keep-Alive

*   **Platform Policy:** Sleeps after 48 hours of no HTTP traffic.
*   **Strategy A: Self-Ping Thread.** The application runs a background thread that requests its own URL every 30 minutes.
    *   *Trade-off:* Can be unreliable if the internal network interface is not mapped to the public ingress, and it consumes internal resources.
*   **Strategy B: Third-Party Monitors (UptimeRobot, Healthchecks.io).**
    *   *Trade-off:* Reliable but relies on external third-party services that may change their free-tier limits or block certain domains.
*   **Strategy C: GitHub Actions Cron (Selected).** A scheduled workflow that runs every 20 hours to `curl` the `/health` endpoint.
    *   *Rationale:* 20 hours provides a ~58% safety margin against the 48-hour timeout. It is managed within the same repository ecosystem, highly visible, and programmable.

### 2. Supabase Keep-Alive

*   **Platform Policy:** Pauses after 7 days of zero database connections/queries.
*   **Strategy:** The GitHub Action cron will dispatch a `POST` request to `/rest/v1/keepalive`. This requires creating a lightweight `keepalive_ping` table and a corresponding REST endpoint via PostgREST.
    *   *Rationale:* A direct database connection via GitHub Actions requires exposing the DB password. Using the REST API with an Anon Key and Row Level Security (RLS) is significantly more secure.

### 3. GitHub Actions Auto-Disable Prevention

*   **Platform Policy:** GitHub automatically disables cron workflows in repositories that haven't had a commit in 60 days.
*   **Strategy:** Integrate a step (`keep-github-actions-alive-min-dependencies`) inside the keep-alive workflow that makes an empty commit to the repository on day 50 of inactivity.
    *   *Rationale:* Ensures the keep-alive engine itself does not silently fail after two months.

## Synchronization Mechanisms

To maintain operational continuity, the GitHub Action acts as the primary orchestrator. Because HF Spaces and Supabase have different timeout windows (48 hours vs. 7 days), standardizing the ping interval to 20 hours satisfies both requirements simultaneously while minimizing excessive network traffic.