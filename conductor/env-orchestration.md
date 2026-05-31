# Dynamic Environment Orchestration

**Date:** May 2026
**Context:** Continuity Engineering & Administration

This document outlines the architecture and implementation of the dynamic environment switching capabilities built into the Spectre Admin Dashboard.

## 1. Architectural Overview

The application is no longer tightly coupled to a single environment. It supports dynamic switching between:

*   **API Target Environments:** Local Development Server vs. Hugging Face Spaces.
*   **Database Storage Layers:** Alpine PostgreSQL Container (Local) vs. Supabase Session Pooler (Remote).

### 1.1 Orchestration Design

The core of this capability is a generic UI component `ConfigSwitcher.tsx`. This component serves as the control layer within the Admin Health Dashboard, replacing the previous static `EnvToggle` button in the navigation header.

*   **Optimistic Synchronization:** When an administrator toggles an environment, the UI immediately displays a loading/synchronizing state using the existing toaster (`notify`).
*   **Role-Based Security:** The orchestration panel is strictly limited to authenticated users possessing the `admin` role, verified through the JWT access token.

## 2. Frontend Implementation

### 2.1 Reusable `ConfigSwitcher` Component

Located at `frontend/src/shared/ui/ConfigSwitcher.tsx`, this component uses `lucide-react` icons and Shadcn primitives to provide a clean, professional interface. It accepts an `onChange` Promise, automatically handling the UX for loading states and error rollbacks.

### 2.2 `AdminHealth.tsx` Integration

The Admin Dashboard now acts as a comprehensive "Health Monitor & Orchestrator". 

*   **API Switcher:** Triggers `setBaseUrl` from `@/lib/config` and immediately invalidates all React Query caches to fetch data from the new endpoint.
*   **Database Switcher:** Makes a `POST` request to the backend's `/admin/config/db` endpoint to orchestrate a database failover/switch.

## 3. Backend Implementation

### 3.1 `health_router.py`

*   **`/admin/stats`:** Returns the real-time active database connection alongside the heartbeat logs.
*   **`/admin/config/db`:** A protected orchestration endpoint that handles the failover request. It is designed to update the infrastructure configuration (e.g., updating Hugging Face secrets or local `.env` files) and trigger a graceful restart of the FastAPI runtime.

## 4. Multi-Subagent Development Workflow

During the implementation of this feature, a multi-subagent mindset was utilized to decouple concerns:

1.  **Component Architecture:** Refactored the rigid `EnvToggle` into the generic `ConfigSwitcher`.
2.  **Frontend Optimistic Sync:** Wired up `notify.info` and `notify.success` to provide transitional feedback during environment switches.
3.  **Backend Config Management:** Implemented the protected `/admin/config/db` endpoint to process orchestration commands.
4.  **Documentation:** Synthesized these architectural decisions into this `.conductor` log for future reference.

## 5. Future Scalability

By using the `ConfigSwitcher` pattern, expanding the infrastructure to include new environments (e.g., AWS RDS, dedicated bare-metal servers, or staging API instances) simply requires adding a new `ConfigOption` object to the array in `AdminHealth.tsx` without rewriting the UI or synchronization logic.