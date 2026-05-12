import { useState, useCallback, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import type { SpectreAuthModalProps, SpectreMode } from "./types";
import { useSpectreConfig } from "./SpectreAuthProvider";
import { themeStyle } from "./theme";
import { ScannerView } from "../features/face-scan/ui/ScannerView";
import { FaceApiClient } from "../features/face-scan/api/face-client";
import { MODE_AUTHENTICATE, MODE_REGISTER } from "../features/face-scan/model/constants";
import type { ScanMode } from "../features/face-scan/model/types";
import { setRuntimeBaseUrl, clearRuntimeBaseUrl } from "../lib/config";
import { useEffect, useRef } from "react";

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
 * **SpectreAuthModal** — modal/overlay variant of the Spectre scanner.
 *
 * Pops up a dialog containing the full face authentication experience.
 * Control visibility with the `open` / `onOpenChange` props.
 *
 * @example
 * ```tsx
 * import { SpectreAuthModal } from 'spectre-snap';
 * import 'spectre-snap/style.css';
 *
 * function App() {
 *   const [open, setOpen] = useState(false);
 *   return (
 *     <>
 *       <button onClick={() => setOpen(true)}>Verify Identity</button>
 *       <SpectreAuthModal
 *         open={open}
 *         onOpenChange={setOpen}
 *         apiKey="spk_..."
 *         userId="user@example.com"
 *         onSuccess={(result) => {
 *           console.log('Verified!', result.sessionId);
 *           setOpen(false);
 *         }}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function SpectreAuthModal(props: SpectreAuthModalProps) {
  const providerConfig = useSpectreConfig();

  const apiKey = props.apiKey ?? providerConfig.apiKey ?? "";
  const userId = props.userId ?? "anonymous";
  const modeConfig: SpectreMode = props.mode ?? "auto";
  const baseUrl = props.baseUrl ?? providerConfig.baseUrl;
  const theme = props.theme ?? providerConfig.theme ?? "dark";
  const redirectUrl = props.redirectUrl ?? null;

  const [resolvedMode, setResolvedMode] = useState<ScanMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Set runtime base URL
  useEffect(() => {
    if (baseUrl) setRuntimeBaseUrl(baseUrl);
    return () => clearRuntimeBaseUrl();
  }, [baseUrl]);

  // Resolve mode when modal opens
  useEffect(() => {
    if (!props.open) {
      // Reset on close
      setResolvedMode(null);
      setLoading(true);
      setError(null);
      return;
    }

    mountedRef.current = true;

    async function resolveMode() {
      setLoading(true);
      setError(null);

      if (modeConfig !== "auto") {
        if (mountedRef.current) {
          setResolvedMode(modeConfig === "register" ? MODE_REGISTER : MODE_AUTHENTICATE);
          setLoading(false);
        }
        return;
      }

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

    if (apiKey) resolveMode();
    else {
      setError("Missing apiKey prop");
      setLoading(false);
    }

    return () => { mountedRef.current = false; };
  }, [props.open, apiKey, userId, modeConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      props.onOpenChange?.(nextOpen);
      if (!nextOpen) {
        props.onClose?.();
      }
    },
    [props.onOpenChange, props.onClose], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const style = useMemo(() => themeStyle(theme), [theme]);

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          scanner-dialog spectre-snap
          glass-strong border-none p-0 overflow-hidden
          w-screen h-[100dvh] max-w-none rounded-none
          sm:w-[440px] sm:h-[860px] sm:max-h-[94dvh] sm:!rounded-[32px]
          [&>button]:hidden
        "
        style={style}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Spectre face scanner</DialogTitle>
        <DialogDescription className="sr-only">
          Biometric identity verification powered by Spectre.
        </DialogDescription>
        <div className="h-full w-full relative overflow-hidden flex flex-col">
          {error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <p style={{ color: "rgb(248 113 113)", fontSize: 14, fontFamily: "monospace" }}>
                {error}
              </p>
            </div>
          ) : loading || resolvedMode === null ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="spectre-snap-spinner" />
            </div>
          ) : (
            <QueryClientProvider client={getQueryClient()}>
              <ScannerView
                apiKey={apiKey}
                externalUserId={userId}
                initialMode={resolvedMode}
                onClose={() => handleOpenChange(false)}
                redirectUrl={redirectUrl}
                _snapCallbacks={{
                  onSuccess: props.onSuccess,
                  onFailed: props.onFailed,
                  onReady: props.onReady,
                  onRedirect: props.onRedirect,
                }}
              />
            </QueryClientProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
