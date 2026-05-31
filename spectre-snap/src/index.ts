// Styles — bundled into dist/style.css by Vite
import "./index.css";

/**
 * Spectre Snap — Identity-as-a-Service SDK for React.
 *
 * Drop-in facial authentication powered by Spectre's liveness detection
 * and identity matching pipeline.
 *
 * @example
 * ```tsx
 * import { SpectreAuth } from 'spectre-snap';
 * import 'spectre-snap/style.css';
 *
 * function LoginPage() {
 *   return (
 *     <SpectreAuth
 *       apiKey="spk_..."
 *       userId="user@example.com"
 *       onSuccess={(result) => console.log('Verified!', result.sessionId)}
 *       onFailed={(reason) => console.log('Failed:', reason)}
 *     />
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export { SpectreAuth } from "./snap/SpectreAuth";
export { SpectreAuthModal } from "./snap/SpectreAuthModal";
export { SpectreAuthProvider } from "./snap/SpectreAuthProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  // Result
  SpectreVerdict,
  SpectreAuthResult,
  // Failure
  SpectreFailureReason,
  // Callbacks
  SpectreAuthCallbacks,
  // Config
  SpectreMode,
  SpectreTheme,
  SpectreLocale,
  SpectreAuthConfig,
  SpectreAuthProps,
  SpectreAuthModalProps,
  // Provider
  SpectreProviderConfig,
} from "./snap/types";
