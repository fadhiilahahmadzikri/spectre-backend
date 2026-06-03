# Spectre Snap Login App

Test login app menggunakan spectre-snap package dengan facial authentication.

## Setup

```bash
npm install
```

## Environment Variables

Buat `.env.local`:

```env
VITE_SPECTRE_BASE_URL=http://localhost:8000
VITE_SPECTRE_API_KEY=your-api-key-here
```

## Run

```bash
npm run dev
```

Buka http://localhost:5173

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
