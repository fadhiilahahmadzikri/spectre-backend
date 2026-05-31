/**
 * Public type definitions for the Spectre Snap SDK.
 *
 * These are the types that consumers import and use.
 * Internal implementation types remain in features/face-scan/model/types.ts.
 */

// ---------------------------------------------------------------------------
// Result Types
// ---------------------------------------------------------------------------

/** Verdict returned after a face authentication attempt. */
export type SpectreVerdict = "ok" | "spoof" | "warn";

/** Detailed result of a Spectre authentication session. */
export interface SpectreAuthResult {
  /** Overall verdict — `ok` means identity verified. */
  verdict: SpectreVerdict;
  /** Human-readable result label. */
  label: string;
  /** Session ID from the backend (maps to `auth_sessions.id`). */
  sessionId?: string;
  /** Cosine similarity score (0–1) for authentication attempts. */
  similarityScore?: number;
  /** Inference time in milliseconds. */
  inferenceTimeMs?: number;
  /** Probability summary: live vs. spoof confidence. */
  summary: {
    live: number;
    spoof: number;
  };
  /** Per-class probability detail (only when detail_mode is enabled). */
  detail: Record<string, number> | null;
}

// ---------------------------------------------------------------------------
// Failure Reasons
// ---------------------------------------------------------------------------

/** Categorized failure reason for the `onFailed` callback. */
export type SpectreFailureReason =
  | "liveness_failed"
  | "face_not_detected"
  | "face_mismatch"
  | "quality_insufficient"
  | "session_expired"
  | "user_cancelled"
  | "camera_denied"
  | "network_error"
  | "system_error";

// ---------------------------------------------------------------------------
// Callback Interfaces
// ---------------------------------------------------------------------------

/** Callbacks fired by SpectreAuth during the authentication lifecycle. */
export interface SpectreAuthCallbacks {
  /** Fired when authentication succeeds (verdict === "ok"). */
  onSuccess?: (result: SpectreAuthResult) => void;
  /** Fired when authentication fails for any reason. */
  onFailed?: (reason: SpectreFailureReason, result?: SpectreAuthResult) => void;
  /** Fired when the user closes/dismisses the scanner. */
  onClose?: () => void;
  /** Fired when the camera is ready and the scanner is active. */
  onReady?: () => void;
  /** Fired when the internal success countdown finishes, replacing the default window.location.href redirect. */
  onRedirect?: () => void;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Scan mode — `auto` determines mode from existing face profile. */
export type SpectreMode = "register" | "authenticate" | "auto";

/** Theme option for the scanner UI. */
export type SpectreTheme = "dark" | "light" | "auto";

/** Locale for UI strings. */
export type SpectreLocale = "id" | "en";

/** Configuration props for the SpectreAuth component. */
export interface SpectreAuthConfig {
  /** The API key issued from the Spectre dashboard. **Required**. */
  apiKey: string;
  /**
   * External user identifier scoping the face profile.
   * If omitted, defaults to `"anonymous"`.
   */
  userId?: string;
  /**
   * Scan mode: `register`, `authenticate`, or `auto`.
   * `auto` (default) checks if a face profile exists and picks accordingly.
   */
  mode?: SpectreMode;
  /** Override the backend API URL. Defaults to HF Spaces production. */
  baseUrl?: string;
  /** URL to redirect to after successful authentication. */
  redirectUrl?: string;
  /** Delay in seconds before redirect (default: 5). */
  redirectDelay?: number;
  /** Enable face anti-spoofing (liveness detection). Default: `true`. */
  fas?: boolean;
  /** Require head-pose scan ring completion. Default: `true`. */
  requirePose?: boolean;
  /** Show preview dialog before submission. Default: `false`. */
  showPreview?: boolean;
  /** Theme variant. Default: `"dark"`. */
  theme?: SpectreTheme;
  /** UI locale. Default: `"id"` (Indonesian). */
  locale?: SpectreLocale;
}

/** Combined props for the SpectreAuth component. */
export type SpectreAuthProps = SpectreAuthConfig & SpectreAuthCallbacks;

/** Props for the modal variant. */
export interface SpectreAuthModalProps extends SpectreAuthProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Called when the modal should close. */
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Provider Config
// ---------------------------------------------------------------------------

/** Global config for SpectreAuthProvider (shared across all instances). */
export interface SpectreProviderConfig {
  /** Default API key for all SpectreAuth instances under this provider. */
  apiKey?: string;
  /** Default backend URL. */
  baseUrl?: string;
  /** Default theme. */
  theme?: SpectreTheme;
  /** Default locale. */
  locale?: SpectreLocale;
}
