import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useScriptLoader } from "@/shared/hooks/use-script-loader";
import {
  CANVAS_PHASES,
  VIGNETTE_PHASES,
  ACTIVE_PHASES,
  PHASES,
  IQA_STATE,
  SCAN_GEOMETRY,
  DEFAULT_AURA_CONFIG,
  MEDIAPIPE_SCRIPT_URLS,
  MODE_REGISTER,
  MODE_AUTHENTICATE,
  REDIRECT_DELAY_SECONDS,
} from "../model/constants";
import type {
  AuraConfig,
  IqaState,
  Landmark,
  LogEntry,
  Phase,
  ScanMode,
  ScanResult,
} from "../model/types";
import { useBrightness } from "../hooks/use-brightness";
import { useBlurMetrics } from "../hooks/use-blur-metrics";
import { useGlitchOpacity } from "../hooks/use-glitch-opacity";
import { useFaceMesh } from "../hooks/use-face-mesh";
import { useIQA } from "../hooks/use-iqa";
import { useProgressiveLog } from "../hooks/use-progressive-log";
import { captureBase64FromVideo } from "../lib/capture-frame";
import { parseSummary, parseDetail } from "../lib/parse-probs";
import { isIqaPhase, isTerminalPhase } from "../lib/phase-guards";
import { FaceApiClient, type FaceApiResponse } from "../api/face-client";
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
import { ResultPanel } from "./result/ResultPanel";
import type { FaceApiErrorPayload, FaceApiSuccessPayload } from "../model/types";

interface ScannerViewProps {
  apiKey: string;
  externalUserId: string;
  onClose?: () => void;
  redirectUrl?: string | null;
}

const { NUM_SEGMENTS, ANGLE_STEP, VIDEO_DISPLAY_SIZE } = SCAN_GEOMETRY;

const INITIAL_CONFIG: ConfigDraft = { fas: true, requirePose: true, showPreview: false };

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) return apiKey;
  return `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`;
}

export function ScannerView({
  apiKey,
  externalUserId,
  onClose,
  redirectUrl = null,
}: ScannerViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [phase, setPhaseState] = useState<Phase>(PHASES.LOADING);
  const [mode, setMode] = useState<ScanMode>(MODE_REGISTER);
  const [config, setConfig] = useState<ConfigDraft>(INITIAL_CONFIG);
  const [activeSegments, setActiveSegments] = useState<Set<number>>(new Set());
  const [revealedSegments, setRevealedSegments] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [draftCapture, setDraftCapture] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<Landmark[] | null>(null);
  const [modeResolved, setModeResolved] = useState(false);

  const phaseRef = useRef<Phase>(PHASES.LOADING);
  const iqaStateRef = useRef<IqaState>(IQA_STATE.NO_FACE);
  const captureGuardRef = useRef(false);
  const requestEpochRef = useRef(0);
  const inflightRef = useRef(false);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialModeRef = useRef(true);
  const lastIqaLogRef = useRef<{ text: string; kind: LogEntry["kind"] }>({
    text: "",
    kind: "info",
  });
  const instantFailsRef = useRef<IqaState[]>([]);

  const clientRef = useRef(new FaceApiClient(apiKey));
  const { currentLog, showLog, clearLog } = useProgressiveLog();
  const avatarControls = useAnimation();

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const scriptsLoaded = useScriptLoader(MEDIAPIPE_SCRIPT_URLS);

  const luminance = useBrightness({
    videoRef,
    enabled:
      phase === PHASES.SEARCHING || phase === PHASES.MORPHING || phase === PHASES.SCANNING,
  });
  const { blur, blurDelta } = useBlurMetrics({
    videoRef,
    landmarks: currentLandmarks,
    enabled: isIqaPhase(phase),
  });
  const glitchOpacity = useGlitchOpacity(
    phase === PHASES.SCANNING ||
      phase === PHASES.CAPTURING ||
      phase === PHASES.PREVIEW ||
      phase === PHASES.ANALYZING,
  );

  const { iqaState, iqaMessage, instantFails } = useIQA({
    landmarks: currentLandmarks,
    luminance,
    blur,
    blurDelta,
    enabled: isIqaPhase(phase),
    ignorePose: phase === PHASES.SCANNING || phase === PHASES.CAPTURING,
  });

  useEffect(() => {
    iqaStateRef.current = iqaState;
  }, [iqaState]);
  useEffect(() => {
    instantFailsRef.current = instantFails;
  }, [instantFails]);

  const cancelRedirect = useCallback(() => {
    if (redirectTimerRef.current !== null) clearInterval(redirectTimerRef.current);
    redirectTimerRef.current = null;
    setRedirectIn(null);
  }, []);

  const handleReset = useCallback(() => {
    cancelRedirect();
    if (revealIntervalRef.current !== null) clearInterval(revealIntervalRef.current);
    revealIntervalRef.current = null;
    if (captureTimerRef.current !== null) clearTimeout(captureTimerRef.current);
    captureTimerRef.current = null;
    requestEpochRef.current++;
    inflightRef.current = false;
    captureGuardRef.current = false;
    clearLog();
    setAnalysisOpen(false);
    lastIqaLogRef.current = { text: "", kind: "info" };
    setCurrentLandmarks(null);
    setActiveSegments(new Set());
    setRevealedSegments(0);
    setResult(null);
    setDraftCapture(null);
    setPhase(PHASES.LOADING);
    setTimeout(() => {
      if (phaseRef.current === PHASES.LOADING) setPhase(PHASES.SEARCHING);
    }, 50);
  }, [cancelRedirect, clearLog, setPhase]);

  const startRedirect = useCallback(() => {
    if (!redirectUrl) return;
    let seconds = REDIRECT_DELAY_SECONDS;
    setRedirectIn(seconds);
    if (redirectTimerRef.current !== null) clearInterval(redirectTimerRef.current);
    redirectTimerRef.current = setInterval(() => {
      seconds--;
      setRedirectIn(seconds);
      if (seconds <= 0) {
        if (redirectTimerRef.current !== null) clearInterval(redirectTimerRef.current);
        redirectTimerRef.current = null;
        setRedirectIn(null);
        window.location.href = redirectUrl;
      }
    }, 1000);
  }, [redirectUrl]);

  const executeApiSubmission = useCallback(
    async (b64: string) => {
      if (inflightRef.current) return;
      inflightRef.current = true;
      const epoch = requestEpochRef.current;

      setPhase(PHASES.ANALYZING);
      showLog("Enkripsi & Kompresi data...", "active");
      await new Promise((r) => setTimeout(r, 300));
      if (requestEpochRef.current !== epoch) {
        inflightRef.current = false;
        return;
      }

      showLog("Gambar diambil", "ok");
      showLog(
        mode === MODE_REGISTER
          ? "Mendaftarkan wajah ke API..."
          : "Memverifikasi identitas ke API...",
        "active",
      );

      const response: FaceApiResponse<FaceApiSuccessPayload & FaceApiErrorPayload> =
        mode === MODE_REGISTER
          ? await clientRef.current.register(externalUserId, b64, config.fas)
          : await clientRef.current.authenticate(externalUserId, b64, config.fas);

      if (requestEpochRef.current !== epoch) {
        inflightRef.current = false;
        return;
      }

      const { ok, status, data } = response;
      if (ok && (status === 200 || status === 202) && data) {
        showLog("Autentikasi Berhasil", "ok");
        const probs = data.metrics;
        const summary = parseSummary(probs);
        const detail = parseDetail(probs);
        const baseLabel =
          mode === MODE_REGISTER ? "Pendaftaran berhasil" : "Identitas terverifikasi";
        const label = config.fas ? baseLabel : `${baseLabel} (FAS off)`;
        setResult({ verdict: "ok", label, summary, detail });
        setPhase(PHASES.COMPLETE);

        if (mode === MODE_AUTHENTICATE && redirectUrl) startRedirect();
        if (mode === MODE_REGISTER) {
          setTimeout(() => {
            if (requestEpochRef.current === epoch) {
              setMode(MODE_AUTHENTICATE);
              showLog("Masuk ke mode Verifikasi", "ok");
            }
          }, 2800);
        }
      } else {
        const err = data?.error ?? {};
        const code = err.code ?? "UNKNOWN";
        const msg = err.message ?? "Terjadi kesalahan";
        const details = err.details ?? {};
        showLog(`API Server: ${code}`, "err");

        if (code === "LIVENESS_CHECK_FAILED") {
          const probs = Array.isArray(details.probabilities) ? details.probabilities : null;
          const conf = typeof details.confidence === "number" ? details.confidence : 0;
          const spoofCls = typeof details.spoof_class === "string" ? details.spoof_class : "unknown";
          const hasProbs = !!probs && probs.length === 6;
          const summary = hasProbs
            ? parseSummary(probs)
            : spoofCls === "realperson"
              ? { live: conf, spoof: 1 - conf }
              : { live: 1 - conf, spoof: conf };
          const detail = hasProbs ? parseDetail(probs) : null;
          showLog(`Spoofing: ${msg}`, "err");
          setResult({ verdict: "spoof", label: "SPOOF", summary, detail });
          setPhase(PHASES.FAILED);
          if (detail) {
            setTimeout(() => {
              if (requestEpochRef.current === epoch) setAnalysisOpen(true);
            }, 1800);
          }
        } else if (code === "FACE_MATCH_FAILED") {
          const sim =
            typeof details.similarity_score === "number" ? details.similarity_score : 0;
          showLog(`Tidak cocok (${sim.toFixed(2)})`, "err");
          setResult({
            verdict: "warn",
            label: "TIDAK COCOK",
            summary: { live: 0, spoof: 0 },
            detail: null,
          });
          setPhase(PHASES.FAILED);
        } else {
          showLog(`${code}: ${msg}`, "err");
          setResult({
            verdict: "warn",
            label: "ERROR",
            summary: { live: 0, spoof: 0 },
            detail: null,
          });
          setPhase(PHASES.FAILED);
        }
      }
      inflightRef.current = false;
    },
    [mode, config.fas, externalUserId, redirectUrl, setPhase, showLog, startRedirect],
  );

  const processCapture = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    const epoch = requestEpochRef.current;
    const video = videoRef.current;
    if (!video) {
      captureGuardRef.current = false;
      inflightRef.current = false;
      return;
    }
    showLog("Menyiapkan data biometrik...", "active");
    await new Promise((r) => setTimeout(r, 450));
    if (requestEpochRef.current !== epoch) {
      inflightRef.current = false;
      return;
    }
    showLog("Memproses frame mentah...", "active");
    const b64 = captureBase64FromVideo(video);
    if (!b64) {
      showLog("Gagal memproses frame video", "err");
      captureGuardRef.current = false;
      inflightRef.current = false;
      setPhase(PHASES.FAILED);
      return;
    }
    inflightRef.current = false;
    if (config.showPreview) {
      setDraftCapture(b64);
      setPhase(PHASES.PREVIEW);
    } else {
      executeApiSubmission(b64);
    }
  }, [config.showPreview, executeApiSubmission, setPhase, showLog]);

  const scheduleCapture = useCallback(
    (delayMs = 1500) => {
      if (captureGuardRef.current) return;
      captureGuardRef.current = true;
      showLog("Memproses bingkai... Tahan posisi wajah Anda", "active");
      const attempt = () => {
        if (phaseRef.current === PHASES.LOADING || phaseRef.current === PHASES.FAILED) {
          captureGuardRef.current = false;
          return;
        }
        if (instantFailsRef.current.length > 0) {
          const fails = instantFailsRef.current;
          let warnMsg = "Menunggu posisi ideal...";
          if (fails.includes(IQA_STATE.BLURRY)) warnMsg = "Kamera sedang fokus... Tahan posisi";
          else if (fails.includes(IQA_STATE.TOO_CLOSE))
            warnMsg = "Terlalu dekat dengan kamera... Mundur sedikit";
          else if (fails.includes(IQA_STATE.LOW_LIGHT)) warnMsg = "Pencahayaan kurang baik...";
          showLog(warnMsg, "warn");
          captureTimerRef.current = setTimeout(attempt, 500);
          return;
        }
        setPhase(PHASES.CAPTURING);
        queueMicrotask(() => processCapture());
      };
      captureTimerRef.current = setTimeout(attempt, delayMs);
    },
    [processCapture, setPhase, showLog],
  );

  const handleFaceFrame = useCallback((landmarks: Landmark[] | null) => {
    const p = phaseRef.current;
    if (
      p !== PHASES.SEARCHING &&
      p !== PHASES.MORPHING &&
      p !== PHASES.SCANNING &&
      p !== PHASES.CAPTURING
    ) {
      setCurrentLandmarks(null);
      return;
    }
    setCurrentLandmarks(landmarks);
  }, []);

  const handleHeadMove = useCallback(
    (landmarks: Landmark[]) => {
      if (phaseRef.current !== PHASES.SCANNING) return;
      const nose = landmarks[1];
      const leftCheek = landmarks[234];
      const rightCheek = landmarks[454];
      const forehead = landmarks[10];
      const chin = landmarks[152];
      const cx = (leftCheek.x + rightCheek.x) / 2;
      const cy = (forehead.y + chin.y) / 2;

      const faceW = Math.abs(rightCheek.x - leftCheek.x);
      const faceH = Math.abs(chin.y - forehead.y);

      const dx = cx - nose.x;
      const dyY = nose.y - cy;
      const dyZ = (chin.z ?? 0) - (forehead.z ?? 0);
      const dy = dyY * 0.5 + dyZ * 0.5;

      const normDx = dx / (faceW || 1);
      const normDy = dy / (faceH || 1);
      if (Math.hypot(normDx, normDy) < 0.055) return;

      const rawAngle = Math.atan2(normDy, normDx) * (180 / Math.PI);
      const angle = (rawAngle + 360 + 90) % 360;
      const targetSegment = Math.floor(angle / ANGLE_STEP);

      setActiveSegments((prev) => {
        const next = new Set(prev);
        for (let offset = -2; offset <= 2; offset++) {
          next.add((targetSegment + offset + NUM_SEGMENTS) % NUM_SEGMENTS);
        }
        return next;
      });
    },
    [],
  );

  const cameraReady = useFaceMesh({
    videoRef,
    canvasRef,
    scriptsLoaded,
    phaseRef,
    iqaStateRef,
    onFaceFrame: handleFaceFrame,
    onHeadMove: handleHeadMove,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const exists = await clientRef.current.lookupUser(externalUserId);
        if (!cancelled) {
          setMode(exists ? MODE_AUTHENTICATE : MODE_REGISTER);
          setModeResolved(true);
        }
      } catch {
        if (!cancelled) {
          setMode(MODE_REGISTER);
          setModeResolved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [externalUserId]);

  useEffect(() => {
    if (cameraReady && modeResolved && phaseRef.current === PHASES.LOADING) {
      setPhase(PHASES.SEARCHING);
    }
  }, [cameraReady, modeResolved, setPhase]);

  useEffect(() => {
    if (phase !== PHASES.SEARCHING) return;
    if (iqaState !== IQA_STATE.READY) return;

    queueMicrotask(() => {
      if (phaseRef.current === PHASES.SEARCHING) setPhase(PHASES.MORPHING);
    });
  }, [iqaState, phase, setPhase]);

  useEffect(() => {
    if (phase !== PHASES.MORPHING) return;

    const revealTimeout = setTimeout(() => {
      if (phaseRef.current !== PHASES.MORPHING) return;
      let current = 0;
      if (revealIntervalRef.current !== null) clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = setInterval(() => {
        current += 2;
        if (current >= NUM_SEGMENTS) {
          if (revealIntervalRef.current !== null) clearInterval(revealIntervalRef.current);
          revealIntervalRef.current = null;
          setRevealedSegments(NUM_SEGMENTS);
        } else {
          setRevealedSegments(current);
        }
      }, 14);
    }, 420);

    const transitionTimeout = setTimeout(() => {
      if (phaseRef.current !== PHASES.MORPHING) return;
      if (config.requirePose) {
        setPhase(PHASES.SCANNING);
      } else {
        const allSegs = new Set<number>(
          Array.from({ length: NUM_SEGMENTS }, (_, i) => i),
        );
        setActiveSegments(allSegs);
        scheduleCapture(1500);
      }
    }, 1150);

    return () => {
      clearTimeout(revealTimeout);
      clearTimeout(transitionTimeout);
      if (revealIntervalRef.current !== null) {
        clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }
    };
  }, [phase, config.requirePose, scheduleCapture, setPhase]);

  useEffect(() => {
    if (phase !== PHASES.SCANNING) return;
    if (captureGuardRef.current) return;
    if (activeSegments.size >= NUM_SEGMENTS - 2) {
      scheduleCapture(500);
    }
  }, [activeSegments, phase, scheduleCapture]);

  useEffect(() => {
    const p = phaseRef.current;
    const eligible =
      p === PHASES.MORPHING || p === PHASES.SCANNING || p === PHASES.CAPTURING;
    if (eligible && iqaState === IQA_STATE.NO_FACE) handleReset();
  }, [iqaState, handleReset]);

  useEffect(() => {
    const isIqa =
      phase === PHASES.SEARCHING || phase === PHASES.SCANNING || phase === PHASES.MORPHING;
    if (!isIqa) {
      lastIqaLogRef.current = { text: "", kind: "info" };
      return;
    }
    let text = iqaMessage.text;
    let kind: LogEntry["kind"] = iqaMessage.kind as LogEntry["kind"];

    if (iqaState === IQA_STATE.READY) {
      if (phase === PHASES.SCANNING) {
        text = captureGuardRef.current
          ? "Memproses bingkai... Tahan posisi wajah Anda"
          : "Putar kepala Anda perlahan";
        kind = "active";
      } else if (!captureGuardRef.current) {
        text = "Wajah terdeteksi";
        kind = "ok";
      }
    } else if (iqaState === IQA_STATE.NO_FACE && phase !== PHASES.SEARCHING) {
      text = "Wajah hilang dari bingkai";
      kind = "warn";
    }

    if (
      text &&
      (lastIqaLogRef.current.text !== text || lastIqaLogRef.current.kind !== kind)
    ) {
      showLog(text, kind);
      lastIqaLogRef.current = { text, kind };
    }
  }, [iqaState, iqaMessage, phase, showLog]);

  useEffect(() => {
    if (!initialModeRef.current) {
      handleReset();
    } else {
      initialModeRef.current = false;
    }
  }, [mode, handleReset]);

  useEffect(() => {
    const active = isIqaPhase(phase);
    if (!active) {
      avatarControls.start({ x: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.3 } });
      return;
    }
    if (iqaState === IQA_STATE.READY) {
      avatarControls.start({
        scale: [1, 1.025, 1],
        x: 0,
        filter: "blur(0px)",
        transition: {
          scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
          x: { duration: 0.3 },
          filter: { duration: 0.3 },
        },
      });
    } else if (iqaState === IQA_STATE.NO_FACE && phase === PHASES.SCANNING) {
      avatarControls.start({
        x: [-12, 12, -8, 8, -4, 4, 0],
        filter: ["blur(0px)", "blur(4px)", "blur(0px)", "blur(2px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        scale: 1,
        transition: {
          x: { repeat: Infinity, repeatDelay: 1.0, duration: 0.5 },
          filter: { repeat: Infinity, repeatDelay: 1.0, duration: 0.5 },
        },
      });
    } else if (iqaState !== IQA_STATE.NO_FACE) {
      avatarControls.start({
        x: [-8, 8, -5, 5, -2, 2, 0],
        filter: ["blur(0px)", "blur(3px)", "blur(0px)", "blur(1px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        scale: 1,
        transition: {
          x: { repeat: Infinity, repeatDelay: 1.2, duration: 0.4 },
          filter: { repeat: Infinity, repeatDelay: 1.2, duration: 0.4 },
        },
      });
    } else {
      avatarControls.start({ x: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.3 } });
    }
  }, [iqaState, phase, avatarControls]);

  useEffect(
    () => () => {
      if (revealIntervalRef.current !== null) clearInterval(revealIntervalRef.current);
      if (redirectTimerRef.current !== null) clearInterval(redirectTimerRef.current);
      if (captureTimerRef.current !== null) clearTimeout(captureTimerRef.current);
    },
    [],
  );

  const auraConfig = useMemo<AuraConfig>(() => {
    const expression =
      phase === PHASES.COMPLETE ? "senang" : phase === PHASES.FAILED ? "sedih" : "normal";
    return { ...DEFAULT_AURA_CONFIG, expression };
  }, [phase]);

  const statusText = useMemo(() => {
    if (phase === PHASES.ANALYZING) return "Memproses data biometrik...";
    if (phase === PHASES.COMPLETE) return "Identitas Terverifikasi";
    if (phase === PHASES.FAILED) {
      if (result?.verdict === "spoof") return "Spoofing Terdeteksi";
      if (result?.verdict === "warn") return "Tidak Dikenali";
      return "Verifikasi Gagal";
    }
    return "";
  }, [phase, result]);

  const isBusy = ACTIVE_PHASES.has(phase);
  const isTerminal = isTerminalPhase(phase);
  const showCanvas = CANVAS_PHASES.has(phase);
  const showVignette = VIGNETTE_PHASES.has(phase);
  const showMode = !isBusy && !isTerminal && phase !== PHASES.PREVIEW;
  const showLogs = !isTerminal && phase !== PHASES.PREVIEW;
  const showSegments = phase !== PHASES.LOADING && phase !== PHASES.SEARCHING;
  const headerOpacity = isBusy || phase === PHASES.PREVIEW ? 0.55 : 1;

  const videoStyle: CSSProperties = {
    width: VIDEO_DISPLAY_SIZE,
    height: VIDEO_DISPLAY_SIZE,
    maxWidth: "none",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) scale(-1, 1)",
    position: "absolute",
  };

  const canvasStyle: CSSProperties = {
    position: "absolute",
    maxWidth: "none",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) scale(-1, 1)",
    opacity: showCanvas ? glitchOpacity : 0,
    transition: "opacity 0.04s linear",
    pointerEvents: "none",
  };

  const showAuraMascot =
    phase === PHASES.ANALYZING || phase === PHASES.COMPLETE || phase === PHASES.FAILED;

  return (
    <div className="relative w-full h-full flex flex-col">
      <ScanningHeader
        opacity={headerOpacity}
        onOpenConfig={() => setDrawerOpen(true)}
        onClose={onClose}
      />

      <ModeIndicator visible={showMode} mode={mode} />

      <div
        className="flex-1 flex flex-col items-center justify-center pt-[20vh]"
        style={{ zIndex: 10 }}
      >
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
                  : phase === PHASES.ANALYZING ||
                      phase === PHASES.PREVIEW ||
                      phase === PHASES.COMPLETE ||
                      phase === PHASES.FAILED
                    ? "blur-[6px]"
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

          {showAuraMascot && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
              <AuraRing size={480} config={auraConfig} />
              {statusText && (
                <div className="my-5 text-white/80 font-medium tracking-tight text-sm mt-4 tracking-[-0.02em]">
                  {statusText}
                </div>
              )}
            </div>
          )}

          {showSegments && (
            <SegmentRing
              phase={phase}
              iqaState={iqaState}
              activeSegments={activeSegments}
              revealedSegments={revealedSegments}
            />
          )}
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
        onApply={(next) => {
          setConfig(next);
          setDrawerOpen(false);
          handleReset();
        }}
        mode={mode}
        apiKeyMasked={maskApiKey(apiKey)}
        externalUserId={externalUserId}
        result={result}
        onOpenAnalysis={() => setAnalysisOpen(true)}
        onReset={() => {
          setDrawerOpen(false);
          handleReset();
        }}
      />

      <AnalysisDrawer
        open={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        result={result}
      />
    </div>
  );
}
