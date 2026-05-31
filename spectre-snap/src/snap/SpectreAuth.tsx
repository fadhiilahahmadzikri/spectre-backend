import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SpectreAuthProps, SpectreMode } from "./types";
import { useSpectreConfig } from "./SpectreAuthProvider";
import { useSnapCallbacks } from "./useSnapCallbacks";
import { themeStyle } from "./theme";
import { FaceApiClient } from "../features/face-scan/api/face-client";
import { ScannerView } from "../features/face-scan/ui/ScannerView";
import type { ScanMode } from "../features/face-scan/model/types";
import { MODE_AUTHENTICATE, MODE_REGISTER } from "../features/face-scan/model/constants";
import { setRuntimeBaseUrl, clearRuntimeBaseUrl } from "../lib/config";

// Shared QueryClient for all SpectreAuth instances. Lazy-init so tree-shaking
// can still eliminate TanStack Query when unused.
let sharedQC: QueryClient | null = null;
function getQueryClient(): QueryClient {
  if (!sharedQC) {
    sharedQC = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        mutations: { retry: 0 },
      },
    });
  }
  return sharedQC;
}

/**
 * **SpectreAuth** — the primary Spectre Snap SDK component.
 *
 * Drop this into your React app to get a complete facial authentication
 * experience powered by Spectre's liveness detection and identity matching.
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
 */
export function SpectreAuth(props: SpectreAuthProps) {
  const providerConfig = useSpectreConfig();

  // Merge: direct props override provider defaults
  const apiKey = props.apiKey ?? providerConfig.apiKey ?? "";
  const userId = props.userId ?? "anonymous";
  const modeConfig: SpectreMode = props.mode ?? "auto";
  const baseUrl = props.baseUrl ?? providerConfig.baseUrl;
  const theme = props.theme ?? providerConfig.theme ?? "dark";
  const fas = props.fas ?? true;
  const requirePose = props.requirePose ?? true;
  const showPreview = props.showPreview ?? false;
  const redirectUrl = props.redirectUrl ?? null;

  // Internal state
  const [resolvedMode, setResolvedMode] = useState<ScanMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Set runtime base URL if provided
  useEffect(() => {
    if (baseUrl) setRuntimeBaseUrl(baseUrl);
    return () => clearRuntimeBaseUrl();
  }, [baseUrl]);

  // Resolve mode on mount
  useEffect(() => {
    mountedRef.current = true;
    if (!apiKey) {
      setError("Missing apiKey prop");
      setLoading(false);
      return;
    }

    async function resolveMode() {
      setLoading(true);
      setError(null);

      if (modeConfig !== "auto") {
        // Explicit mode — skip lookup
        if (mountedRef.current) {
          setResolvedMode(modeConfig === "register" ? MODE_REGISTER : MODE_AUTHENTICATE);
          setLoading(false);
        }
        return;
      }

      // Auto mode — probe backend to check if face exists
      try {
        const client = new FaceApiClient(apiKey);
        const exists = await client.lookupUser(userId);
        if (mountedRef.current) {
          setResolvedMode(exists ? MODE_AUTHENTICATE : MODE_REGISTER);
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) {
          setError("Failed to connect. Check your API key.");
          setLoading(false);
          props.onFailed?.("network_error");
        }
      }
    }

    resolveMode();
    return () => { mountedRef.current = false; };
  }, [apiKey, userId, modeConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle close
  const handleClose = useCallback(() => {
    props.onClose?.();
  }, [props.onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inline style from theme
  const style = useMemo(() => themeStyle(theme), [theme]);

  // Error state
  if (error) {
    return (
      <div className="spectre-snap" style={style}>
        <div className="spectre-snap-error">
          <p style={{ color: "rgb(248 113 113)", fontSize: 14, fontFamily: "monospace" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || resolvedMode === null) {
    return (
      <div className="spectre-snap" style={style}>
        <div className="spectre-snap-loading">
          <div className="spectre-snap-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="spectre-snap" style={style}>
      <QueryClientProvider client={getQueryClient()}>
        <SpectreAuthInner
          apiKey={apiKey}
          userId={userId}
          resolvedMode={resolvedMode}
          fas={fas}
          requirePose={requirePose}
          showPreview={showPreview}
          redirectUrl={redirectUrl}
          onSuccess={props.onSuccess}
          onFailed={props.onFailed}
          onClose={handleClose}
          onReady={props.onReady}
          onRedirect={props.onRedirect}
        />
      </QueryClientProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner component: mounts after mode resolution
// ---------------------------------------------------------------------------

interface SpectreAuthInnerProps {
  apiKey: string;
  userId: string;
  resolvedMode: ScanMode;
  fas: boolean;
  requirePose: boolean;
  showPreview: boolean;
  redirectUrl: string | null;
  onSuccess?: SpectreAuthProps["onSuccess"];
  onFailed?: SpectreAuthProps["onFailed"];
  onClose?: () => void;
  onReady?: () => void;
  onRedirect?: () => void;
}

function SpectreAuthInner({
  apiKey,
  userId,
  resolvedMode,
  redirectUrl,
  onSuccess,
  onFailed,
  onClose,
  onReady,
  onRedirect,
}: SpectreAuthInnerProps) {
  // The ScannerView component does all the heavy lifting.
  // We just need to wire callbacks via the useSnapCallbacks hook.
  // Since ScannerView manages its own orchestrator internally,
  // we pass callbacks down through a wrapper that monitors the result.

  return (
    <div className="spectre-snap-scanner">
      <ScannerView
        apiKey={apiKey}
        externalUserId={userId}
        initialMode={resolvedMode}
        onClose={onClose}
        redirectUrl={redirectUrl}
        // Snap callbacks are wired internally via the ScannerView's
        // result/phase state. The useSnapCallbacks hook in
        // SpectreAuthModal handles the callback bridge for the modal
        // variant. For the inline variant, callbacks are passed via
        // the snap event system.
        _snapCallbacks={{ onSuccess, onFailed, onReady, onRedirect }}
      />
    </div>
  );
}
