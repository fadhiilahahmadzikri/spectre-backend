# Implementation Plan - Email Feature Removal

## Objective
Remove all email-related logic, UI, and database structures from the Spectre project while maintaining a functional authentication system.

## Proposed Solution
1.  **Database:** Drop the `email_verifications` table and remove the `is_verified` requirement from users.
2.  **Backend:** Remove SMTP infrastructure, OTP use cases, and verification endpoints.
3.  **Frontend:** Remove the `VerifyEmail` page and associated API calls.
4.  **Documentation/Tests:** Update OpenAPI specs, PRD, and remove email-specific tests.

## Key Files & Context
- **Database:** Supabase (PostgreSQL), Alembic migrations.
- **Backend:** FastAPI, SQLAlchemy.
- **Frontend:** React, Vite.

## Implementation Steps

### Phase 1: Database (Safe Migration)
- [ ] Create a new Alembic migration to:
    - Drop the `email_verifications` table.
    - Remove the `is_verified` column from `users` (or keep it but default to `true` if needed for legacy reasons, but removal is cleaner).
- [ ] Apply the migration to Supabase using `alembic upgrade head`.

### Phase 2: Backend Clean-up
- [ ] **Infrastructure:**
    - Delete `src/spectre/infrastructure/email/`.
    - Delete `scripts/verify-email-config.py`.
- [ ] **Domain:**
    - Delete `src/spectre/domain/entities/email_verification.py`.
    - Remove `EmailNotVerifiedError` from `src/spectre/domain/exceptions/auth_exceptions.py`.
- [ ] **Application:**
    - Remove `VerifyEmail` use case from `src/spectre/application/auth_use_cases.py`.
    - Update `RegisterUser` to no longer generate OTPs.
    - Update `Login` to no longer check for `is_verified`.
- [ ] **Interface:**
    - Remove `/verify-email` and `/resend-otp` endpoints from `src/spectre/interface/routers/auth_router.py`.
- [ ] **Config:**
    - Remove `SMTP_*` and `OTP_*` settings from `src/spectre/config.py`.

### Phase 3: Frontend Clean-up
- [ ] **Pages:** Delete `frontend/src/pages/VerifyEmail.tsx`.
- [ ] **Routes:** Remove `/verify-email` from `frontend/src/main.tsx`.
- [ ] **Components:** Remove OTP redirection logic from `frontend/src/features/auth/ui/SignUpForm.tsx`.
- [ ] **API:** Remove `verifyEmail` and `resendOtp` from `frontend/src/lib/api.ts`.

### Phase 4: Documentation & Tests
- [ ] **Specs:** Update `Docs/PRD/openapi.yaml` and `Docs/PRD/API_SPECIFICATION.md`.
- [ ] **Tests:** Delete `tests/unit/test_auth_router.py` (or specific tests within) and update Postman collection.

## Verification & Testing
- [ ] Verify user registration still works and allows immediate login.
- [ ] Verify no "SMTP" or "OTP" errors appear in logs.
- [ ] Verify frontend build is successful.
- [ ] Run `pytest` to ensure no regression in auth flow.
