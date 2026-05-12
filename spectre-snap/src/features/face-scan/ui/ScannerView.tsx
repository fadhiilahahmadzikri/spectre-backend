import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SpectreAuthCallbacks, SpectreAuthResult, SpectreFailureReason } from "../../snap/types";
import {
  CANVAS_PHASES,
  VIGNETTE_PHASES,
  ACTIVE_PHASES,
  PHASES,
  SCAN_GEOMETRY,
} from "../model/constants";
import { isTerminalPhase } from "../lib/phase-guards";
import { useProgressiveLog } from "../hooks/use-progressive-log";
import { useScanOrchestrator } from "../hooks/use-scan-orchestrator";
import { setPersistedRedirectUrl } from "@/shared/config/scan.config";
import { CONFIG_DRAFT_DEFAULT } from "../model/config-draft";
import type { ScanMode } from "../model/types";
import { AuraRing } from "./aura-ring/AuraRing";
import { IrisShell } from "./iris-shell/IrisShell";
import { CornerFrame } from "./iris-shell/CornerFrame";
import { ScrimVignette } from "./iris-shell/ScrimVignette";
import { SegmentRing } from "./segments/SegmentRing";
import { ScanningHeader } from "./header/ScanningHeader";
import { ModeIndicator } from "./header/ModeIndicator";
import { ProgressiveLog } from "./overlays/ProgressiveLog";
import { CaptureFlash } from "./overlays/CaptureFlash";
import { PreviewDialog } from "./dialogs/PreviewDialog";
import { AnalysisDrawer } from "./dialogs/AnalysisDrawer";
import { ConfigDrawer, type ConfigDraft } from "./dialogs/ConfigDrawer";
import { DiagnosticInterceptor } from "./dialogs/DiagnosticInterceptor";
import { LiveStatusOverlay } from "./overlays/LiveStatusOverlay";
import { ResultPanel } from "./result/ResultPanel";

/** @internal Snap SDK callback bridge — only set when mounted via SpectreAuth. */
export interface SnapCallbackBridge {
  onSuccess?: SpectreAuthCallbacks["onSuccess"];
  onFailed?: SpectreAuthCallbacks["onFailed"];
  onReady?: SpectreAuthCallbacks["onReady"];
  onRedirect?: SpectreAuthCallbacks["onRedirect"];
}

interface ScannerViewProps {
  apiKey: string;
  externalUserId: string;
  initialMode: ScanMode;
  onClose?: () => void;
  redirectUrl?: string | null;
  /** @internal Injected by SpectreAuth — do not use directly. */
  _snapCallbacks?: SnapCallbackBridge;
}

const { VIDEO_DISPLAY_SIZE } = SCAN_GEOMETRY;
const INITIAL_CONFIG: ConfigDraft = CONFIG_DRAFT_DEFAULT;

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) return apiKey;
  return `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`;
}

export function ScannerView({
  apiKey,
  externalUserId,
  initialMode,
  onClose,
  redirectUrl = null,
  _snapCallbacks,
}: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [config, setConfig] = useState<ConfigDraft>(INITIAL_CONFIG);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // --- Snap SDK callback bridge ---
  const snapFiredRef = useRef({ success: false, failed: false, ready: false });
  const snapCbRef = useRef(_snapCallbacks);
  snapCbRef.current = _snapCallbacks;

  const { currentLog, showLog, clearLog } = useProgressiveLog();

  const {
    phase,
    mode,
    result,
    redirectIn,
    activeSegments,
    revealedSegments,
    draftCapture,
    analysisOpen,
    iqaState,
    cameraReady,
    glitchOpacity,
    auraConfig,
    statusText,
    avatarControls,
    handleReset,
    setAnalysisOpen,
    executeApiSubmission,
    pendingDiagnostics,
    continueFromDiagnostics,
    pendingBenchmark,
    dismissBenchmark,
  } = useScanOrchestrator({
    videoRef,
    canvasRef,
    apiKey,
    config,
    externalUserId,
    initialMode,
    redirectUrl,
    showLog,
    clearLog,
    snapCbRef,
  });

  // --- Derived booleans ---
  const isBusy = ACTIVE_PHASES.has(phase);
  const isTerminal = isTerminalPhase(phase);
  const showCanvas = CANVAS_PHASES.has(phase);
  const showVignette = VIGNETTE_PHASES.has(phase);
  const showMode = !isBusy && !isTerminal && phase !== PHASES.PREVIEW;
  const showLogs = !isTerminal && phase !== PHASES.PREVIEW && phase !== PHASES.ANALYZING;
  const showSegments =
    phase !== PHASES.LOADING &&
    phase !== PHASES.SEARCHING &&
    phase !== PHASES.ANALYZING &&
    phase !== PHASES.COMPLETE &&
    phase !== PHASES.FAILED;
  const headerOpacity = isBusy || phase === PHASES.PREVIEW ? 0.55 : 1;
  const showAuraMascot =
    phase === PHASES.ANALYZING || phase === PHASES.COMPLETE || phase === PHASES.FAILED;


  // Reset fired flags on scan reset
  useEffect(() => {
    if (phase === PHASES.LOADING || phase === PHASES.SEARCHING) {
      snapFiredRef.current = { success: false, failed: false, ready: false };
    }
  }, [phase]);

  // Fire onReady
  useEffect(() => {
    if (cameraReady && !snapFiredRef.current.ready && snapCbRef.current) {
      snapFiredRef.current.ready = true;
      snapCbRef.current.onReady?.();
    }
  }, [cameraReady]);

  // Fire onSuccess / onFailed
  useEffect(() => {
    if (!snapCbRef.current || !result) return;
    if (phase === PHASES.COMPLETE && result.verdict === "ok" && !snapFiredRef.current.success) {
      snapFiredRef.current.success = true;
      const mapped: SpectreAuthResult = {
        verdict: result.verdict,
        label: result.label,
        sessionId: result.session_id,
        similarityScore: result.similarity_score,
        inferenceTimeMs: result.inference_time_ms,
        summary: result.summary,
        detail: result.detail,
      };
      snapCbRef.current.onSuccess?.(mapped);
    } else if (
      (phase === PHASES.FAILED || (phase === PHASES.COMPLETE && result.verdict !== "ok")) &&
      !snapFiredRef.current.failed
    ) {
      snapFiredRef.current.failed = true;
      let reason: SpectreFailureReason = "system_error";
      if (result.verdict === "spoof") reason = "liveness_failed";
      else if (result.label.toLowerCase().includes("mismatch")) reason = "face_mismatch";

      const mapped: SpectreAuthResult = {
        verdict: result.verdict,
        label: result.label,
        sessionId: result.session_id,
        similarityScore: result.similarity_score,
        inferenceTimeMs: result.inference_time_ms,
        summary: result.summary,
        detail: result.detail,
      };
      snapCbRef.current.onFailed?.(reason, mapped);
    }
  }, [phase, result]);

  // --- Styles ---
  const videoStyle: CSSProperties = useMemo(
    () => ({
      width: VIDEO_DISPLAY_SIZE,
      height: VIDEO_DISPLAY_SIZE,
      maxWidth: "none",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%) scale(-1, 1)",
      position: "absolute",
    }),
    [],
  );

  const canvasStyle: CSSProperties = useMemo(
    () => ({
      position: "absolute",
      maxWidth: "none",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%) scale(-1, 1)",
      opacity: showCanvas ? glitchOpacity : 0,
      transition: "opacity 0.04s linear",
      pointerEvents: "none",
    }),
    [showCanvas, glitchOpacity],
  );

  return (
    <div className="relative w-full h-full flex flex-col">
      <ScanningHeader
        opacity={headerOpacity}
        onOpenConfig={() => setDrawerOpen(true)}
        onClose={onClose}
      />

      <ModeIndicator visible={showMode} mode={mode} />

      <div className="flex-1 flex flex-col items-center justify-center pt-[12vh]" style={{ zIndex: 10 }}>
        <motion.div
          animate={avatarControls}
          className="relative w-[400px] h-[400px] flex items-center justify-center"
          style={{ transformOrigin: "center center" }}
        >
          <IrisShell phase={phase}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`object-cover transition-all duration-500 ${
                !cameraReady
                  ? "opacity-0"
                  : phase === PHASES.ANALYZING || phase === PHASES.PREVIEW || phase === PHASES.COMPLETE || phase === PHASES.FAILED
                    ? "opacity-0"
                    : ""
              }`}
              style={videoStyle}
            />
            <canvas ref={canvasRef} style={canvasStyle} />
            <CaptureFlash
              visible={phase === PHASES.CAPTURING}
              borderRadius={phase === PHASES.SEARCHING || phase === PHASES.LOADING ? 44 : 130}
            />
            {(phase === PHASES.SEARCHING || phase === PHASES.MORPHING) && (
              <div
                className="pointer-events-none absolute inset-0 m-auto"
                style={{
                  width: phase === PHASES.MORPHING ? 260 : 240,
                  height: phase === PHASES.MORPHING ? 260 : 240,
                }}
              >
                <CornerFrame phase={phase} iqaState={iqaState} />
              </div>
            )}
            <ScrimVignette show={showVignette} />
          </IrisShell>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
            style={{
              opacity: showAuraMascot ? 1 : 0,
              transition: showAuraMascot ? "opacity 600ms ease 350ms" : "opacity 300ms ease",
            }}
          >
            {showAuraMascot && (
              <>
                <AuraRing size={380} config={auraConfig} />
                {statusText && (
                  <div className="my-5 text-white/80 font-medium tracking-tight text-sm mt-4 tracking-[-0.02em]">
                    {statusText}
                  </div>
                )}
              </>
            )}
          </div>

          <div
            className="absolute inset-0 w-full h-full z-30 pointer-events-none"
            style={{
              opacity: showSegments ? 1 : 0,
              transition: showSegments ? "opacity 700ms ease" : "opacity 300ms ease",
            }}
          >
            <SegmentRing
              phase={phase}
              iqaState={iqaState}
              activeSegments={activeSegments}
              revealedSegments={revealedSegments}
            />
          </div>
        </motion.div>

        <ProgressiveLog log={currentLog} visible={showLogs} />
      </div>

      <PreviewDialog
        open={phase === PHASES.PREVIEW}
        base64Data={draftCapture}
        onRetake={handleReset}
        onSubmit={() => draftCapture && executeApiSubmission(draftCapture)}
      />

      <AnimatePresence>
        {isTerminal && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 right-0 px-5 z-30"
            style={{ bottom: 24 }}
          >
            <ResultPanel result={result} onReset={handleReset} redirectIn={redirectIn} />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfigDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentConfig={config}
        onApply={(next) => { setConfig(next); setDrawerOpen(false); setPersistedRedirectUrl(next.redirectUrl); handleReset(); }}
        mode={mode}
        apiKeyMasked={maskApiKey(apiKey)}
        externalUserId={externalUserId}
        result={result}
        onOpenAnalysis={() => setAnalysisOpen(true)}
        onReset={() => { setDrawerOpen(false); handleReset(); }}
      />

      <AnalysisDrawer
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        result={result}
      />

      <DiagnosticInterceptor
        open={(pendingDiagnostics !== null || pendingBenchmark !== null)}
        diagnostics={pendingDiagnostics}
        benchmark={pendingBenchmark}
        onContinue={() => {
          if (pendingDiagnostics) continueFromDiagnostics();
          else dismissBenchmark();
        }}
      />

      <LiveStatusOverlay
        phase={phase}
        detailMode={config.detailMode}
        benchmarkMode={config.benchmarkMode}
        visible={!(isTerminal && result !== null)}
      />
    </div>
  );
}
