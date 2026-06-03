# Spectre Snap

> **Identity-as-a-Service** — Embeddable facial authentication for React applications.

Spectre Snap is a drop-in React component that provides a complete facial authentication experience powered by Spectre's liveness detection (Face Anti-Spoofing) and biometric identity matching pipeline.

## Installation

```bash
npm install @thewhitenigs/spectre-snap
```

## Quick Start

```tsx
import { SpectreAuth } from '@thewhitenigs/spectre-snap';
import '@thewhitenigs/spectre-snap/style.css';

function LoginPage() {
  return (
    <SpectreAuth
      apiKey="spk_..."
      userId="user@example.com"
      onSuccess={(result) => {
        console.log('Verified!', result.sessionId);
        // redirect or update auth state
      }}
      onFailed={(reason) => {
        console.log('Failed:', reason);
      }}
    />
  );
}
```

## Modal Variant

```tsx
import { useState } from 'react';
import { SpectreAuthModal } from '@thewhitenigs/spectre-snap';
import '@thewhitenigs/spectre-snap/style.css';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Verify Identity</button>
      <SpectreAuthModal
        open={open}
        onOpenChange={setOpen}
        apiKey="spk_..."
        userId="user@example.com"
        onSuccess={(result) => {
          console.log('Verified!', result.sessionId);
          setOpen(false);
        }}
      />
    </>
  );
}
```

## Global Configuration (Provider)

```tsx
import { SpectreAuthProvider, SpectreAuth } from '@thewhitenigs/spectre-snap';
import '@thewhitenigs/spectre-snap/style.css';

function App() {
  return (
    <SpectreAuthProvider
      apiKey="spk_..."
      baseUrl="https://your-backend.com"
      theme="dark"
    >
      {/* All SpectreAuth instances inherit the provider config */}
      <SpectreAuth
        userId="user@example.com"
        onSuccess={handleSuccess}
      />
    </SpectreAuthProvider>
  );
}
```

## Props Reference

### SpectreAuth

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | Provider value | API key from the Spectre dashboard. Required unless `SpectreAuthProvider` supplies it |
| `userId` | `string` | `"anonymous"` | External user identifier |
| `mode` | `"register" \| "authenticate" \| "auto"` | `"auto"` | Scan mode — `auto` detects from existing profile |
| `baseUrl` | `string` | HF Spaces prod | Override backend API URL |
| `redirectUrl` | `string` | — | URL to redirect after success |
| `redirectDelay` | `number` | `5` | Seconds before redirect |
| `fas` | `boolean` | `true` | Enable face anti-spoofing |
| `requirePose` | `boolean` | `true` | Require head-pose ring scan |
| `showPreview` | `boolean` | `false` | Show preview before submission |
| `theme` | `"dark" \| "light" \| "auto"` | `"dark"` | UI theme |
| `locale` | `"id" \| "en"` | `"id"` | Deprecated placeholder; scanner copy remains Indonesian in this release |

### Callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| `onSuccess` | `(result: SpectreAuthResult) => void` | Fired on successful authentication |
| `onFailed` | `(reason: SpectreFailureReason, result?: SpectreAuthResult) => void` | Fired on failure |
| `onClose` | `() => void` | Fired when user dismisses the scanner |
| `onReady` | `() => void` | Fired when camera is active and scanner is ready |
| `onRedirect` | `() => void` | Fired when the success countdown completes instead of assigning `window.location.href` |

### SpectreAuthResult

```ts
interface SpectreAuthResult {
  verdict: "ok" | "spoof" | "warn";
  label: string;
  sessionId?: string;
  similarityScore?: number;
  inferenceTimeMs?: number;
  summary: { live: number; spoof: number };
  detail: Record<string, number> | null;
}
```

### SpectreFailureReason

| Reason | Description |
|--------|-------------|
| `liveness_failed` | Face anti-spoofing detected a presentation attack |
| `face_not_detected` | No face found in the frame |
| `face_mismatch` | Face does not match the registered profile |
| `quality_insufficient` | Image quality too low for reliable inference |
| `session_expired` | Scan session expired |
| `user_cancelled` | User closed the scanner |
| `camera_denied` | Camera permission denied |
| `network_error` | Network connectivity issue |
| `system_error` | Unexpected backend error |

## TypeScript

All types are exported and fully documented. Import them directly:

```ts
import type {
  SpectreAuthResult,
  SpectreFailureReason,
  SpectreAuthProps,
  SpectreErrorCode,
} from '@thewhitenigs/spectre-snap';
```

## Requirements

- React ≥ 18
- Modern browser with camera access (WebRTC)
- Valid Spectre API key

## License

ISC
