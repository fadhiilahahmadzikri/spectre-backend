import { useCallback, useEffect, useRef } from "react";
import type {
  SpectreAuthCallbacks,
  SpectreAuthResult,
  SpectreFailureReason,
} from "./types";
import type { Phase, ScanResult } from "../features/face-scan/model/types";

/**
 * Bridge hook that translates internal scan orchestrator events
 * into the public SpectreAuth callback interface.
 *
 * This is the equivalent of the "postMessage → callback" bridge in the
 * classic Snap pattern, implemented as direct React callback wiring since
 * we are not using iframes.
 */
export function useSnapCallbacks(
  callbacks: SpectreAuthCallbacks,
  phase: Phase,
  result: ScanResult | null,
  cameraReady: boolean,
) {
  // Refs keep stable references to avoid stale closures
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  // Track which events have already been fired this session to avoid duplicates
  const firedRef = useRef({
    success: false,
    failed: false,
    ready: false,
  });

  // --- onReady ---
  useEffect(() => {
    if (cameraReady && !firedRef.current.ready) {
      firedRef.current.ready = true;
      cbRef.current.onReady?.();
    }
  }, [cameraReady]);

  // --- onSuccess / onFailed ---
  useEffect(() => {
    if (phase !== "COMPLETE" && phase !== "FAILED") return;
    if (!result) return;

    const mapped = mapResult(result);

    if (phase === "COMPLETE" && result.verdict === "ok" && !firedRef.current.success) {
      firedRef.current.success = true;
      cbRef.current.onSuccess?.(mapped);
    } else if (
      (phase === "FAILED" || result.verdict !== "ok") &&
      !firedRef.current.failed
    ) {
      firedRef.current.failed = true;
      const reason = mapFailureReason(result);
      cbRef.current.onFailed?.(reason, mapped);
    }
  }, [phase, result]);

  /** Reset fired flags — called when the scanner resets. */
  const resetCallbacks = useCallback(() => {
    firedRef.current = { success: false, failed: false, ready: false };
  }, []);

  /** Fire onClose from external trigger. */
  const fireClose = useCallback(() => {
    cbRef.current.onClose?.();
  }, []);

  return { resetCallbacks, fireClose };
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapResult(r: ScanResult): SpectreAuthResult {
  return {
    verdict: r.verdict,
    label: r.label,
    sessionId: r.session_id,
    similarityScore: r.similarity_score,
    inferenceTimeMs: r.inference_time_ms,
    summary: r.summary,
    detail: r.detail,
  };
}

function mapFailureReason(r: ScanResult): SpectreFailureReason {
  if (r.verdict === "spoof") return "liveness_failed";
  if (r.verdict === "warn") {
    // The label contains hints about the specific failure
    const label = r.label.toLowerCase();
    if (label.includes("mismatch") || label.includes("identitas")) return "face_mismatch";
    return "system_error";
  }
  return "system_error";
}
