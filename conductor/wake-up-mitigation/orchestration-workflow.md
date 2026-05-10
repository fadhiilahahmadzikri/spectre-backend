# Orchestration Workflow

## Deployment Sequencing & Workflow

The orchestration pipeline is divided into three distinct phases to ensure proper synchronization between the local environment, GitHub Actions, and the cloud services.

```plantuml
@startuml
skinparam linetype ortho
skinparam componentStyle rectangle

package "Phase 1: Infrastructure Prep" {
  [Local DB Setup] --> [Create keepalive_ping Table]
  [Create keepalive_ping Table] --> [Configure RLS Policies]
  [Deploy to HF Spaces] --> [Expose /health Endpoint]
}

package "Phase 2: Orchestration Setup" {
  [Gather Credentials] --> [Configure GHA Secrets]
  note right
    HF_SPACE_URL, HF_TOKEN
    SUPABASE_URL, SUPABASE_ANON_KEY
  end note
  [Configure GHA Secrets] --> [Commit keepalive.yml]
}

package "Phase 3: Runtime Synchronization" {
  [GHA Cron (20h)] --> [Ping HF Space (/health)]
  [GHA Cron (20h)] --> [Ping Supabase (/rest/v1/keepalive)]
  [Ping HF Space (/health)] --> [Reset 48h Timer]
  [Ping Supabase (/rest/v1/keepalive)] --> [Reset 7d Timer]
  
  [GHA Cron (20h)] --> [Check Repo Age]
  [Check Repo Age] --> [Auto-commit (Day 50)]
}

"Phase 1: Infrastructure Prep" --> "Phase 2: Orchestration Setup"
"Phase 2: Orchestration Setup" --> "Phase 3: Runtime Synchronization"
@enduml
```

## Sequence of Events (Runtime)

```plantuml
@startuml
actor "GitHub Actions\n(Cron Orchestrator)" as GHA
participant "Hugging Face Space\n(/health)" as HF
participant "Supabase REST API\n(/rest/v1/keepalive)" as Supabase
database "PostgreSQL\n(keepalive_ping table)" as DB

GHA -> HF: GET /health (Optional: Bearer Token)
activate HF
HF --> GHA: HTTP 200 OK (Timers Reset)
deactivate HF

GHA -> Supabase: POST /rest/v1/keepalive
activate Supabase
Supabase -> DB: INSERT INTO keepalive_ping
activate DB
DB --> Supabase: Success
deactivate DB
Supabase --> GHA: HTTP 201 Created (Timers Reset)
deactivate Supabase

GHA -> GHA: Check repository commit age
alt Repo age >= 50 days
    GHA -> GHA: Create dummy commit
end
@enduml
```

## Explanation

1. **Infrastructure Prep:** The database must be prepared with the proper schema and RLS policies before the automation begins. The `/health` endpoint must return a 200 OK.
2. **Orchestration Setup:** Secrets map the orchestrator (GitHub Actions) to the targets.
3. **Runtime:** The dual-ping approach ensures both systems receive traffic, remaining synchronized and active.