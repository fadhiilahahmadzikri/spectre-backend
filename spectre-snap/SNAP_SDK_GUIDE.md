# Spectre Snap SDK — Developer Documentation

> How to build, publish, and integrate `@thewhitenigs/spectre-snap` as an Identity-as-a-Service NPM package.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Build System](#build-system)
3. [Publishing to NPM](#publishing-to-npm)
4. [Integration Guide](#integration-guide)
5. [API Reference](#api-reference)
6. [Webhook Events](#webhook-events)

---

## Architecture Overview

Spectre Snap is an **embedded React SDK** that provides face authentication as a drop-in component.

```
┌─────────────────────────────────────────────────┐
│  Third-Party Application                        │
│                                                 │
│  ┌────────────────────────────────────────────┐  │
│  │  @thewhitenigs/spectre-snap (NPM package)  │  │
│  │                                            │  │
│  │  ┌──────────────────┐  ┌───────────────┐   │  │
│  │  │ SpectreAuthModal │  │ SpectreAuth   │   │  │
│  │  │ (dialog wrapper) │  │ (inline)      │   │  │
│  │  └────────┬─────────┘  └───────┬───────┘   │  │
│  │           │                    │            │  │
│  │           ▼                    ▼            │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │        ScannerView (core)            │   │  │
│  │  │  Camera → FAS → Embedding → Match    │   │  │
│  │  └────────────────┬─────────────────────┘   │  │
│  │                   │                         │  │
│  └───────────────────┼─────────────────────────┘  │
│                      │ onSuccess / onFailed        │
│                      ▼                             │
│   handleResult(SpectreAuthResult)                  │
└──────────────────────┬──────────────────────────────┘
                       │ X-API-Key header
                       ▼
              ┌──────────────────┐
              │  Spectre Backend │
              │  /api/v1/faces/* │
              └────────┬─────────┘
                       │ Celery async
                       ▼
              ┌──────────────────┐
              │  Webhook POST    │
              │  to client URL   │
              └──────────────────┘
```

**Dual feedback path:**
- **SDK callbacks** (`onSuccess`/`onFailed`) — real-time UI feedback
- **Webhooks** (`face.authenticated`, `face.spoof_rejected`) — server-to-server verification

### Identity Gating (Persistent `userId`)
Spectre Snap relies on an **external** `userId` (provided by your application) to perform Identity Gating in `"auto"` mode:
1. When the scanner opens, the backend checks if a Face Profile exists for this `userId`.
2. If **not found**, the SDK automatically enters `register` mode and binds the captured face to the `userId`.
3. If **found**, the SDK automatically enters `authenticate` mode and verifies the captured face against the stored profile.
*Note: Do not use random UUIDs for `userId` on every render, otherwise Spectre will always attempt to register a new user.*

---

## Build System

### Prerequisites

```bash
node >= 18
npm >= 9
```

### Dual-Mode Vite Config

The `vite.config.ts` supports two build modes:

| Mode | Command | Output | Purpose |
|------|---------|--------|---------|
| `default` | `npm run dev` | Dev server | Local playground at `localhost:5174` |
| `lib` | `npm run build:lib` | `dist/` | NPM library bundle |

### Build Commands

```bash
# Development playground (full app with router, settings, etc.)
cd spectre-snap
npm run dev

# Library build (produces ESM + CJS + CSS + TypeScript declarations)
npm run build:lib

# Verify the build output
ls dist/
# spectre-snap.js       (ESM, ~540KB)
# spectre-snap.cjs      (CJS, ~396KB)
# spectre-snap.css      (Styles, ~112KB)
# index.d.ts            (TypeScript declarations)
# snap/                 (Component-level type definitions)
```

### Package Structure

```json
{
  "name": "@thewhitenigs/spectre-snap",
  "version": "1.0.3",
  "type": "module",
  "main": "./dist/spectre-snap.cjs",
  "module": "./dist/spectre-snap.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/spectre-snap.js",
      "require": "./dist/spectre-snap.cjs",
      "types": "./dist/index.d.ts"
    },
    "./style.css": "./dist/spectre-snap.css"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

---

## Publishing to NPM

### First-time Setup

```bash
# 1. Login to NPM
npm login

# 2. Create a Granular Access Token at:
#    https://www.npmjs.com/settings/<username>/tokens/granular-access-tokens/new
#
#    Settings:
#    - Token name: spectre
#    - Bypass 2FA: ✅ checked
#    - Permissions: Read and write
#    - Expiration: 90 days

# 3. Set the token
npm config set //registry.npmjs.org/:_authToken=npm_YOUR_TOKEN_HERE
```

### Publishing

```bash
cd spectre-snap

# Build & verify locally
npm run build:lib

# Create tarball for local testing (optional)
npm pack
# => thewhitenigs-spectre-snap-1.0.3.tgz (~290KB)

# Publish to public registry
npm publish --access public
# => + @thewhitenigs/spectre-snap@1.0.3
```

### Version Bumping

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch --no-git-tag-version
npm publish --access public

# Minor release (1.0.1 → 1.1.0)
npm version minor --no-git-tag-version
npm publish --access public
```

---

## Integration Guide

### Installation

```bash
npm install @thewhitenigs/spectre-snap
```

### Minimal Setup (Modal)

```tsx
import { SpectreAuthModal } from "@thewhitenigs/spectre-snap";
import type { SpectreAuthResult, SpectreFailureReason } from "@thewhitenigs/spectre-snap";
import "@thewhitenigs/spectre-snap/style.css";

function App() {
  const [open, setOpen] = useState(false);

  function handleSuccess(result: SpectreAuthResult) {
    console.log("Verified!", result.sessionId, result.summary.live);
    setOpen(false);
  }

  function handleFailed(reason: SpectreFailureReason) {
    console.error("Failed:", reason);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}>Verify Identity</button>
      <SpectreAuthModal
        open={open}
        onOpenChange={setOpen}
        onClose={() => setOpen(false)}
        apiKey={import.meta.env.VITE_SPECTRE_API_KEY}
        userId={currentUser.id}
        onSuccess={handleSuccess}
        onFailed={handleFailed}
      />
    </>
  );
}
```

### Inline Component

```tsx
import { SpectreAuth } from "@thewhitenigs/spectre-snap";
import "@thewhitenigs/spectre-snap/style.css";

function VerifyPage() {
  return (
    <SpectreAuth
      apiKey={process.env.SPECTRE_API_KEY}
      userId={user.id}
      onSuccess={(result) => redirect("/dashboard")}
      onFailed={(reason) => showError(reason)}
    />
  );
}
```

### With Provider (Multi-Component)

```tsx
import { SpectreAuthProvider, SpectreAuthModal } from "@thewhitenigs/spectre-snap";
import "@thewhitenigs/spectre-snap/style.css";

function App() {
  return (
    <SpectreAuthProvider
      apiKey={import.meta.env.VITE_SPECTRE_API_KEY}
      baseUrl="https://thewhitenigs-spectre-backend.hf.space"
    >
      <SpectreAuthModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        userId={user.id}
        onSuccess={handleVerified}
      />
    </SpectreAuthProvider>
  );
}
```

---

## API Reference

### Components

| Component | Description |
|-----------|-------------|
| `<SpectreAuth />` | Inline scanner — renders directly in the DOM |
| `<SpectreAuthModal />` | Scanner wrapped in a dialog overlay |
| `<SpectreAuthProvider />` | Context provider for shared config across components |

### Administrative API (Backend)
If you host the Spectre Backend, an administrative API is available under `/api/v1/admin/*` to manage the ecosystem. All admin routes require a valid session belonging to a user with the `admin` role.
- **`GET /admin/users`**: List and paginate platform users
- **`GET /admin/applications`**: Manage tenant applications
- **`GET /admin/api-keys`**: Audit and revoke API keys
- **`GET /admin/face-profiles`**: Manage enrolled identities
- **`GET /admin/auth-sessions`**: Review authentication telemetry and logs

### Props: `SpectreAuthModal`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | ✅ | Controls modal visibility |
| `onClose` | `() => void` | ✅ | Called when user closes the modal |
| `apiKey` | `string` | Provider value | Spectre API key. Required unless `SpectreAuthProvider` supplies it |
| `userId` | `string` | ✅ | External user ID from your auth system |
| `onSuccess` | `(result: SpectreAuthResult) => void` | ✅ | Called on successful verification |
| `onFailed` | `(reason: SpectreFailureReason) => void` | | Called on verification failure |
| `onReady` | `() => void` | | Called when scanner is loaded and camera active |
| `onRedirect` | `() => void` | | Called when SDK's success countdown finishes, replacing the default `window.location.href` redirect. Use this to handle smooth SPA transitions. |
| `mode` | `"auto" \| "register" \| "authenticate"` | | Default: `"auto"` |
| `baseUrl` | `string` | | Override API base URL |
| `theme` | `SpectreTheme` | | Custom theme overrides |

### Types

```typescript
interface SpectreAuthResult {
  verdict: "ok" | "spoof" | "warn";
  label: string;
  sessionId?: string;
  similarityScore?: number;
  inferenceTimeMs?: number;
  summary: { live: number; spoof: number };
  detail: Record<string, number> | null;
}

type SpectreFailureReason =
  | "liveness_failed"
  | "face_not_detected"
  | "face_mismatch"
  | "quality_insufficient"
  | "session_expired"
  | "user_cancelled"
  | "camera_denied"
  | "network_error"
  | "system_error";
```

---

## Webhook Events

When a face operation completes, Spectre sends a signed webhook to the URL configured in your TenantApplication:

### Event Types

| Event | Trigger |
|-------|---------|
| `face.registered` | New face profile created |
| `face.authenticated` | Face match successful |
| `face.no_match` | Face didn't match stored profile |
| `face.spoof_rejected` | Liveness check failed |
| `face.failed` | Processing error |

### Payload Example

```json
{
  "event": "face.authenticated",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "app_id": "123e4567-e89b-12d3-a456-426614174000",
  "external_user_id": "user-123",
  "status": "authenticated",
  "liveness_class": "realperson",
  "liveness_confidence": 0.97,
  "match": true,
  "similarity_score": 0.89,
  "inference_time_ms": 342,
  "timestamp": "2026-05-12T17:48:00Z"
}
```

### Signature Verification

```
X-Spectre-Signature: sha256=<HMAC-SHA256 of payload body>
```

Verify with your webhook secret (set via dashboard):

```python
import hmac, hashlib

def verify_webhook(body: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

---

## Changelog

### Unreleased
- **feat**: Per-instance SDK base URL/config wiring, provider-compatible API key typing, and typed `SpectreError` exports.
- **fix**: Vitest jsdom setup, package metadata alignment, non-secret scan-mode cache ids, and scoped package root styling.

### v1.1.0 (2026-05-13)
- **feat**: Identity Gating with persistent `userId` support.
- **feat**: Administrative APIs exposed for ecosystem management.
- **fix**: Cleaned up Hugging Face Spaces deployment pipeline.

### v1.0.1 (2026-05-12)
- **fix**: Inline SVG logo in FaceIDGlyph (was referencing `/logo.svg` which doesn't exist in consumer apps)

### v1.0.0 (2026-05-12)
- **Initial release**: SpectreAuth, SpectreAuthModal, SpectreAuthProvider
- Full camera-based face verification with liveness detection
- Dual build: ESM + CJS with TypeScript declarations
- Bundled CSS with isolated styles
- SDK callbacks: onSuccess, onFailed, onReady
