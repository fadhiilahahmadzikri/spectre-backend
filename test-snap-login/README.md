# Spectre Snap Login Demo

Demo consumer app for the published `@thewhitenigs/spectre-snap` package.

The demo accepts the SDK `onSuccess` callback immediately, then performs one authenticated `GET /api/v1/sessions/{session_id}` lookup when the SDK returns a `sessionId`.

Namespaces:

- `/` or `#/`: product login flow and dashboard.
- `#/lab`: technical view for SDK callback data, session lookup data, and raw JSON.

## Setup

```bash
npm install
```

Create `.env.local` from `.env.example`:

```env
VITE_SPECTRE_BASE_URL=https://thewhitenigs-spectre-backend.hf.space
VITE_SPECTRE_API_KEY=spk_...
VITE_SPECTRE_TEST_USER_ID=spectre-test-user
```

## Run Demo

```bash
npm run dev
```

Open `http://localhost:5174` or `https://spectre-test.autovoid.cyou` for the product flow.

Open `http://localhost:5174/#/lab` for the technical lab.

## What To Observe

1. Enter an email. The email becomes the SDK `userId`.
2. Click `Continue with Spectre`.
3. The SDK modal performs register/authenticate.
4. `onSuccess` opens the dashboard immediately.
5. The demo fetches `GET /api/v1/sessions/{session_id}` once and attaches server-confirmed session details when available.
6. The `#/lab` namespace shows SDK callback data, session lookup data, and the client decision.

## Verification

```bash
npm run type-check
npm run build
```
