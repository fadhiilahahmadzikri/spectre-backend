import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useAnimation, type AnimationControls } from "framer-motion";
import {
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
  BenchmarkApiResponse,
  InferenceDiagnostics,
  IqaState,
  Landmark,
  LogEntry,
  Phase,
  ScanMode,
  ScanResult,
  FaceApiErrorPayload,
  FaceApiSuccessPayload,
} from "../model/types";
import type { ConfigDraft } from "../model/config-draft";
import { useBrightness } from "./use-brightness";
import { useBlurMetrics } from "./use-blur-metrics";
import { useGlitchOpacity } from "./use-glitch-opacity";
import { useIQA } from "./use-iqa";
import { useScriptLoader } from "@/shared/hooks/use-script-loader";
import { useFaceMesh } from "./use-face-mesh";
import { captureBase64FromVideo } from "../lib/capture-frame";
import { parseSummary, parseDetail } from "../lib/parse-probs";
import { isIqaPhase } from "../lib/phase-guards";
import { FaceApiClient, type FaceApiResponse } from "../api/face-client";
import { useScanSession } from "../model/scan-store";
import { scan } from "@/shared/lib/copy";

const { NUM_SEGMENTS, ANGLE_STEP } = SCAN_GEOMETRY;

export interface UseScanOrchestratorParams {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  apiKey: string;
  config: ConfigDraft;
  externalUserId: string;
  redirectUrl: string | null;
  showLog: (text: string, kind: LogEntry["kind"]) => void;
  clearLog: () => void;
}

export interface UseScanOrchestratorReturn {
  phase: Phase;
  mode: ScanMode;
  result: ScanResult | null;
  redirectIn: number | null;
  activeSegments: ReadonlySet<number>;
  revealedSegments: number;
  draftCapture: string | null;
  analysisOpen: boolean;
  modeResolved: boolean;
  currentLandmarks: Landmark[] | null;
  iqaState: IqaState;
  iqaMessage: { text: string; kind: string };
  cameraReady: boolean;
  glitchOpacity: number;
  auraConfig: AuraConfig;
  statusText: string;
  avatarControls: AnimationControls;
  handleReset: () => void;
  setAnalysisOpen: (v: boolean) => void;
  executeApiSubmission: (b64: string) => Promise<void>;
  pendingDiagnostics: InferenceDiagnostics | null;
  continueFromDiagnostics: () => void;
  pendingBenchmark: BenchmarkApiResponse | null;
  dismissBenchmark: () => void;
}

export function useScanOrchestrator({
  videoRef,
  canvasRef,
  apiKey,
  config,
  externalUserId,
  redirectUrl,
  showLog,
  clearLog,
}: UseScanOrchestratorParams): UseScanOrchestratorReturn {
  const { getCachedMode, setCachedMode } = useScanSession();
  const cachedMode = getCachedMode(apiKey);

  const [phase, setPhaseState] = useState<Phase>(PHASES.LOADING);
  const [mode, setMode] = useState<ScanMode>(cachedMode ?? MODE_REGISTER);
  const [activeSegments, setActiveSegments] = useState<Set<number>>(new Set());
  const [revealedSegments, setRevealedSegments] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [draftCapture, setDraftCapture] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [currentLandmarks, setCurrentLandmarks] = useState<Landmark[] | null>(null);
  const [modeResolved, setModeResolved] = useState(cachedMode === MODE_AUTHENTICATE);
  const [pendingDiagnostics, setPendingDiagnostics] = useState<InferenceDiagnostics | null>(null);
  const [pendingBenchmark, setPendingBenchmark] = useState<BenchmarkApiResponse | null>(null);
  const pendingPhaseRef = useRef<Phase | null>(null);

  const phaseRef = useRef<Phase>(PHASES.LOADING);
  const iqaStateRef = useRef<IqaState>(IQA_STATE.NO_FACE);
  const captureGuardRef = useRef(false);
  const requestEpochRef = useRef(0);
  const inflightRef = useRef(false);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialModeRef = useRef(true);
  const lastIqaLogRef = useRef<{ text: string; kind: LogEntry["kind"] }>({ text: "", kind: "info" });
  const instantFailsRef = useRef<IqaState[]>([]);
  const clientRef = useRef(new FaceApiClient(apiKey));
  // Primary cancellation path for network calls. Reset in handleReset so an
  // in-flight submission from a previous scan session is dropped the moment
  // the user restarts.
  const abortControllerRef = useRef<AbortController>(new AbortController());

  const avatarControls = useAnimation();

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // --- Sensor hooks ---
  const scriptsLoaded = useScriptLoader(MEDIAPIPE_SCRIPT_URLS);

  const luminance = useBrightness({
    videoRef,
    enabled: phase === PHASES.SEARCHING || phase === PHASES.MORPHING || phase === PHASES.SCANNING,
  });
  const { blur, blurDelta } = useBlurMetrics({
    videoRef,
    landmarks: currentLandmarks,
    enabled: isIqaPhase(phase),
  });
  const glitchOpacity = useGlitchOpacity(
    phase === PHASES.SCANNING || phase === PHASES.CAPTURING || phase === PHASES.PREVIEW || phase === PHASES.ANALYZING,
  );
  const { iqaState, iqaMessage, instantFails } = useIQA({
    landmarks: currentLandmarks,
    luminance,
    blur,
    blurDelta,
    enabled: isIqaPhase(phase),
    ignorePose: phase === PHASES.SCANNING || phase === PHASES.CAPTURING,
  });

  useEffect(() => { iqaStateRef.current = iqaState; }, [iqaState]);
  useEffect(() => { instantFailsRef.current = instantFails; }, [instantFails]);

  // --- Core callbacks ---
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
    // Cancel any in-flight FaceApiClient request from the previous session.
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
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
    setPendingDiagnostics(null);
    setPendingBenchmark(null);
    pendingPhaseRef.current = null;
    setPhase(PHASES.LOADING);
    setTimeout(() => {
      if (phaseRef.current === PHASES.LOADING) setPhase(PHASES.SEARCHING);
    }, 50);
  }, [cancelRedirect, clearLog, setPhase]);

  const startRedirect = useCallback(() => {
    const target = config.redirectUrl || redirectUrl;
    if (!target) return;
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
        window.location.href = target;
      }
    }, 1000);
  }, [redirectUrl, config.redirectUrl]);

  const executeApiSubmission = useCallback(
    async (b64: string) => {
      if (inflightRef.current) return;
      inflightRef.current = true;
      const epoch = requestEpochRef.current;

      setPhase(PHASES.ANALYZING);
      showLog(scan.logs.encrypting, "active");
      await new Promise((r) => setTimeout(r, 300));
      if (requestEpochRef.current !== epoch) { inflightRef.current = false; return; }

      showLog(scan.logs.imageCaptured, "ok");
      showLog(
        mode === MODE_REGISTER
          ? scan.logs.registeringToApi
          : scan.logs.verifyingToApi,
        "active",
      );

      const signal = abortControllerRef.current.signal;

      // Local capture — do NOT rely on the `pendingBenchmark` closure value
      // below. That state setter is async and `pendingBenchmark` is not in
      // this callback's deps, so reading it later in the same invocation
      // would always return the stale render-time value (null).
      let benchmarkResult: BenchmarkApiResponse | null = null;
      if (config.benchmarkMode) {
        showLog("Running benchmark across models…", "active");
        const benchRes = await clientRef.current.benchmark(b64, externalUserId, { signal });
        if (requestEpochRef.current !== epoch) { inflightRef.current = false; return; }
        if (benchRes.ok && benchRes.data) {
          benchmarkResult = benchRes.data;
          setPendingBenchmark(benchRes.data);
          showLog("Benchmark complete", "ok");
        } else {
          showLog("Benchmark unavailable, continuing", "warn");
        }
      }

      const response: FaceApiResponse<FaceApiSuccessPayload & FaceApiErrorPayload> =
        mode === MODE_REGISTER
          ? await clientRef.current.register(externalUserId, b64, config.fas, { signal, detailMode: config.detailMode })
          : await clientRef.current.authenticate(externalUserId, b64, config.fas, { signal, detailMode: config.detailMode });

      if (requestEpochRef.current !== epoch) { inflightRef.current = false; return; }

      const { ok, status, data } = response;
      if (ok && (status === 200 || status === 202) && data) {
        showLog(scan.logs.authSuccess, "ok");
        const probs = data.metrics;
        const summary = parseSummary(probs);
        const detail = parseDetail(probs);
        const baseLabel = mode === MODE_REGISTER
          ? scan.logs.registerSuccess
          : scan.logs.identityVerified;
        const label = config.fas ? baseLabel : `${baseLabel} (FAS off)`;
        setResult({ verdict: "ok", label, summary, detail });

        if (config.detailMode && data.diagnostics) {
          setPendingDiagnostics(data.diagnostics);
          pendingPhaseRef.current = PHASES.COMPLETE;
        } else if (benchmarkResult !== null) {
          pendingPhaseRef.current = PHASES.COMPLETE;
        } else {
          setPhase(PHASES.COMPLETE);
          if (mode === MODE_AUTHENTICATE && (config.redirectUrl || redirectUrl)) startRedirect();
          if (mode === MODE_REGISTER) {
            setTimeout(() => {
              if (requestEpochRef.current === epoch) {
                setMode(MODE_AUTHENTICATE);
                setCachedMode(apiKey, MODE_AUTHENTICATE);
                showLog(scan.logs.enteringVerifyMode, "ok");
              }
            }, 2800);
          }
        }
      } else {
        const err = data?.error ?? {};
        const code = err.code ?? "UNKNOWN";
        const msg = err.message ?? scan.logs.genericError;
        const details = err.details ?? {};
        showLog(scan.logs.apiError(code), "err");

        if (code === "LIVENESS_CHECK_FAILED") {
          const probs = Array.isArray(details.probabilities) ? details.probabilities : null;
          const conf = typeof details.confidence === "number" ? details.confidence : 0;
          const spoofCls = typeof details.spoof_class === "string" ? details.spoof_class : "unknown";
          const hasProbs = !!probs && probs.length === 6;
          const summary = hasProbs
            ? parseSummary(probs)
            : spoofCls === "realperson" ? { live: conf, spoof: 1 - conf } : { live: 1 - conf, spoof: conf };
          const detail = hasProbs ? parseDetail(probs) : null;
          showLog(scan.logs.spoofing(msg), "err");
          setResult({ verdict: "spoof", label: scan.logs.spoofShort, summary, detail });
          if (config.detailMode && details.diagnostics) {
            setPendingDiagnostics(details.diagnostics);
            pendingPhaseRef.current = PHASES.FAILED;
          } else if (benchmarkResult !== null) {
            pendingPhaseRef.current = PHASES.FAILED;
          } else {
            setPhase(PHASES.FAILED);
            if (detail) {
              setTimeout(() => { if (requestEpochRef.current === epoch) setAnalysisOpen(true); }, 1800);
            }
          }
        } else if (code === "FACE_MATCH_FAILED") {
          const sim = typeof details.similarity_score === "number" ? details.similarity_score : 0;
          showLog(scan.logs.mismatch(sim.toFixed(2)), "err");
          setResult({ verdict: "warn", label: scan.logs.mismatchShort, summary: { live: 0, spoof: 0 }, detail: null });
          if (config.detailMode && details.diagnostics) {
            setPendingDiagnostics(details.diagnostics);
            pendingPhaseRef.current = PHASES.FAILED;
          } else if (benchmarkResult !== null) {
            pendingPhaseRef.current = PHASES.FAILED;
          } else {
            setPhase(PHASES.FAILED);
          }
        } else {
          showLog(`${code}: ${msg}`, "err");
          setResult({ verdict: "warn", label: scan.logs.errorShort, summary: { live: 0, spoof: 0 }, detail: null });
          if (benchmarkResult !== null) {
            pendingPhaseRef.current = PHASES.FAILED;
          } else {
            setPhase(PHASES.FAILED);
          }
        }
      }
      inflightRef.current = false;
    },
    [
      apiKey,
      mode,
      config.fas,
      config.detailMode,
      config.redirectUrl,
      config.benchmarkMode,
      externalUserId,
      redirectUrl,
      setCachedMode,
      setPhase,
      showLog,
      startRedirect,
    ],
  );

  const processCapture = useCallback(async () => {
    if (inflightRef.current) return;
    inflightRef.current = true;
    const epoch = requestEpochRef.current;
    const video = videoRef.current;
    if (!video) { captureGuardRef.current = false; inflightRef.current = false; return; }
    showLog(scan.logs.preparingBiometric, "active");
    await new Promise((r) => setTimeout(r, 450));
    if (requestEpochRef.current !== epoch) { inflightRef.current = false; return; }
    showLog(scan.logs.processingRawFrame, "active");
    const b64 = captureBase64FromVideo(video);
    if (!b64) {
      showLog(scan.logs.frameProcessingFailed, "err");
      captureGuardRef.current = false;
      inflightRef.current = false;
      setPhase(PHASES.FAILED);
      return;
    }
    inflightRef.current = false;
    if (config.showPreview) { setDraftCapture(b64); setPhase(PHASES.PREVIEW); }
    else { executeApiSubmission(b64); }
  }, [config.showPreview, executeApiSubmission, setPhase, showLog, videoRef]);

  const scheduleCapture = useCallback(
    (delayMs = 1500) => {
      if (captureGuardRef.current) return;
      captureGuardRef.current = true;
      showLog(scan.logs.processingFrameHold, "active");
      const attempt = () => {
        if (phaseRef.current === PHASES.LOADING || phaseRef.current === PHASES.FAILED) {
          captureGuardRef.current = false;
          return;
        }
        if (instantFailsRef.current.length > 0) {
          const fails = instantFailsRef.current;
          let warnMsg: string = scan.logs.waitingForPosition;
          if (fails.includes(IQA_STATE.BLURRY)) warnMsg = scan.logs.cameraFocusing;
          else if (fails.includes(IQA_STATE.TOO_CLOSE)) warnMsg = scan.logs.tooClose;
          else if (fails.includes(IQA_STATE.LOW_LIGHT)) warnMsg = scan.logs.poorLighting;
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
    if (p !== PHASES.SEARCHING && p !== PHASES.MORPHING && p !== PHASES.SCANNING && p !== PHASES.CAPTURING) {
      setCurrentLandmarks(null);
      return;
    }
    setCurrentLandmarks(landmarks);
  }, []);

  const handleHeadMove = useCallback((landmarks: Landmark[]) => {
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
  }, []);

  // --- FaceMesh ---
  const cameraReady = useFaceMesh({
    videoRef,
    canvasRef,
    scriptsLoaded,
    phaseRef,
    iqaStateRef,
    onFaceFrame: handleFaceFrame,
    onHeadMove: handleHeadMove,
  });

  // --- Effects: phase transitions ---
  useEffect(() => {
    // If mode already resolved from cache, skip lookup
    if (cachedMode === MODE_AUTHENTICATE) return;

    let cancelled = false;
    (async () => {
      try {
        const exists = await clientRef.current.lookupUser(externalUserId, {
          signal: abortControllerRef.current.signal,
        });
        if (cancelled) return;
        if (exists) {
          setMode(MODE_AUTHENTICATE);
          setCachedMode(apiKey, MODE_AUTHENTICATE);
        } else {
          setMode(MODE_REGISTER);
        }
        setModeResolved(true);
      } catch {
        if (!cancelled) { setMode(MODE_REGISTER); setModeResolved(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [externalUserId, apiKey, cachedMode, setCachedMode]);

  useEffect(() => {
    if (cameraReady && modeResolved && phaseRef.current === PHASES.LOADING) setPhase(PHASES.SEARCHING);
  }, [cameraReady, modeResolved, setPhase]);

  useEffect(() => {
    if (phase !== PHASES.SEARCHING || iqaState !== IQA_STATE.READY) return;
    queueMicrotask(() => { if (phaseRef.current === PHASES.SEARCHING) setPhase(PHASES.MORPHING); });
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
        } else { setRevealedSegments(current); }
      }, 14);
    }, 420);
    const transitionTimeout = setTimeout(() => {
      if (phaseRef.current !== PHASES.MORPHING) return;
      if (config.requirePose) { setPhase(PHASES.SCANNING); }
      else {
        setActiveSegments(new Set(Array.from({ length: NUM_SEGMENTS }, (_, i) => i)));
        scheduleCapture(1500);
      }
    }, 1150);
    return () => {
      clearTimeout(revealTimeout);
      clearTimeout(transitionTimeout);
      if (revealIntervalRef.current !== null) { clearInterval(revealIntervalRef.current); revealIntervalRef.current = null; }
    };
  }, [phase, config.requirePose, scheduleCapture, setPhase]);

  useEffect(() => {
    if (phase !== PHASES.SCANNING || captureGuardRef.current) return;
    if (activeSegments.size >= NUM_SEGMENTS - 2) scheduleCapture(500);
  }, [activeSegments, phase, scheduleCapture]);

  useEffect(() => {
    const p = phaseRef.current;
    const eligible = p === PHASES.MORPHING || p === PHASES.SCANNING || p === PHASES.CAPTURING;
    if (eligible && iqaState === IQA_STATE.NO_FACE) handleReset();
  }, [iqaState, handleReset]);

  // IQA log sync
  useEffect(() => {
    const isIqa = phase === PHASES.SEARCHING || phase === PHASES.SCANNING || phase === PHASES.MORPHING;
    if (!isIqa) { lastIqaLogRef.current = { text: "", kind: "info" }; return; }
    let text = iqaMessage.text;
    let kind: LogEntry["kind"] = iqaMessage.kind as LogEntry["kind"];
    if (iqaState === IQA_STATE.READY) {
      if (phase === PHASES.SCANNING) {
        text = captureGuardRef.current
          ? scan.logs.processingFrameHold
          : scan.logs.rotateHead;
        kind = "active";
      } else if (!captureGuardRef.current) {
        text = scan.logs.faceDetected;
        kind = "ok";
      }
    } else if (iqaState === IQA_STATE.NO_FACE && phase !== PHASES.SEARCHING) {
      text = scan.logs.faceLost;
      kind = "warn";
    }
    if (text && (lastIqaLogRef.current.text !== text || lastIqaLogRef.current.kind !== kind)) {
      showLog(text, kind);
      lastIqaLogRef.current = { text, kind };
    }
  }, [iqaState, iqaMessage, phase, showLog]);

  // Mode change reset
  useEffect(() => {
    if (!initialModeRef.current) handleReset();
    else initialModeRef.current = false;
  }, [mode, handleReset]);

  // Avatar animation
  useEffect(() => {
    const active = isIqaPhase(phase);
    if (!active) {
      avatarControls.start({ x: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.3 } });
      return;
    }
    if (iqaState === IQA_STATE.READY) {
      avatarControls.start({
        scale: [1, 1.025, 1], x: 0, filter: "blur(0px)",
        transition: { scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }, x: { duration: 0.3 }, filter: { duration: 0.3 } },
      });
    } else if (iqaState === IQA_STATE.NO_FACE && phase === PHASES.SCANNING) {
      avatarControls.start({
        x: [-12, 12, -8, 8, -4, 4, 0],
        filter: ["blur(0px)", "blur(4px)", "blur(0px)", "blur(2px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        scale: 1,
        transition: { x: { repeat: Infinity, repeatDelay: 1.0, duration: 0.5 }, filter: { repeat: Infinity, repeatDelay: 1.0, duration: 0.5 } },
      });
    } else if (iqaState !== IQA_STATE.NO_FACE) {
      avatarControls.start({
        x: [-8, 8, -5, 5, -2, 2, 0],
        filter: ["blur(0px)", "blur(3px)", "blur(0px)", "blur(1px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        scale: 1,
        transition: { x: { repeat: Infinity, repeatDelay: 1.2, duration: 0.4 }, filter: { repeat: Infinity, repeatDelay: 1.2, duration: 0.4 } },
      });
    } else {
      avatarControls.start({ x: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.3 } });
    }
  }, [iqaState, phase, avatarControls]);

  // Cleanup
  useEffect(() => () => {
    if (revealIntervalRef.current !== null) clearInterval(revealIntervalRef.current);
    if (redirectTimerRef.current !== null) clearInterval(redirectTimerRef.current);
    if (captureTimerRef.current !== null) clearTimeout(captureTimerRef.current);
    abortControllerRef.current.abort();
  }, []);

  // --- Derived state ---
  const auraConfig = useMemo<AuraConfig>(() => {
    const expression = phase === PHASES.COMPLETE ? "berhasil" : phase === PHASES.FAILED ? "gagal" : "normal";
    return { ...DEFAULT_AURA_CONFIG, expression };
  }, [phase]);

  const statusText = useMemo(() => {
    if (phase === PHASES.ANALYZING) return scan.logs.processingBiometric;
    if (phase === PHASES.COMPLETE) return scan.logs.identityVerifiedShort;
    if (phase === PHASES.FAILED) {
      if (result?.verdict === "spoof") return scan.logs.spoofDetected;
      if (result?.verdict === "warn") return scan.logs.unknownIdentity;
      return scan.logs.verificationFailed;
    }
    return "";
  }, [phase, result]);

  const continueFromDiagnostics = useCallback(() => {
    const nextPhase = pendingPhaseRef.current;
    setPendingDiagnostics(null);
    pendingPhaseRef.current = null;
    if (!nextPhase) return;
    const epoch = requestEpochRef.current;
    setPhase(nextPhase);
    if (nextPhase === PHASES.COMPLETE) {
      if (mode === MODE_AUTHENTICATE && (config.redirectUrl || redirectUrl)) startRedirect();
      if (mode === MODE_REGISTER) {
        setTimeout(() => {
          if (requestEpochRef.current === epoch) {
            setMode(MODE_AUTHENTICATE);
            setCachedMode(apiKey, MODE_AUTHENTICATE);
            showLog(scan.logs.enteringVerifyMode, "ok");
          }
        }, 2800);
      }
    }
  }, [apiKey, mode, config.redirectUrl, redirectUrl, setCachedMode, setPhase, showLog, startRedirect]);

  const dismissBenchmark = useCallback(() => {
    setPendingBenchmark(null);
    const nextPhase = pendingPhaseRef.current;
    if (!nextPhase) return;
    pendingPhaseRef.current = null;
    const epoch = requestEpochRef.current;
    setPhase(nextPhase);
    if (nextPhase === PHASES.COMPLETE) {
      if (mode === MODE_AUTHENTICATE && (config.redirectUrl || redirectUrl)) startRedirect();
      if (mode === MODE_REGISTER) {
        setTimeout(() => {
          if (requestEpochRef.current === epoch) {
            setMode(MODE_AUTHENTICATE);
            setCachedMode(apiKey, MODE_AUTHENTICATE);
            showLog(scan.logs.enteringVerifyMode, "ok");
          }
        }, 2800);
      }
    }
  }, [apiKey, mode, config.redirectUrl, redirectUrl, setCachedMode, setPhase, showLog, startRedirect]);

  return {
    phase,
    mode,
    result,
    redirectIn,
    activeSegments,
    revealedSegments,
    draftCapture,
    analysisOpen,
    modeResolved,
    currentLandmarks,
    iqaState,
    iqaMessage,
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
  };
}
