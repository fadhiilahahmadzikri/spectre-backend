# Spectre Snap Login Demo

Demo consumer app for the published `@thewhitenigs/spectre-snap` package, using the restored login flow from the industrial package branch.

## Setup

```bash
npm install
```

Create `.env.local` from `.env.example`:

```env
VITE_SPECTRE_BASE_URL=https://thewhitenigs-spectre-backend.hf.space
VITE_SPECTRE_API_KEY=spk_...
```

## Run

```bash
npm run dev
```

Open `http://localhost:5174` or `https://spectre-test.autovoid.cyou`.

## What's Tested

- ✅ SpectreAuthProvider setup
- ✅ SpectreAuthModal implementation
- ✅ Per-instance baseUrl and apiKey configuration
- ✅ Authentication success/error handling
- ✅ Token result display (accessToken, idToken, sessionId)
- ✅ CSS import from spectre-snap package

## Features

- **Facial Authentication**: Click "Start Authentication" to open Spectre auth modal
- **Environment-driven config**: baseUrl and apiKey from .env
- **Result Display**: Shows tokens and session info on success
- **Error Handling**: Logs auth errors to console
- **Responsive Design**: Works on desktop and mobile
