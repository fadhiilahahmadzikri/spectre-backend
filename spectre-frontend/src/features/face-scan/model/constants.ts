import type {
  AuraConfig,
  IqaState,
  Phase,
  ScanMode,
} from "./types";
import { SCAN_CONFIG } from "@/shared/config/scan.config";

export const PHASES = {
  USER_ID: "USER_ID",
  LOADING: "LOADING",
  SEARCHING: "SEARCHING",
  MORPHING: "MORPHING",
  SCANNING: "SCANNING",
  PREVIEW: "PREVIEW",
  CAPTURING: "CAPTURING",
  ANALYZING: "ANALYZING",
  COMPLETE: "COMPLETE",
  FAILED: "FAILED",
} as const satisfies Record<string, Phase>;

export const IQA_STATE = {
  NO_FACE: "NO_FACE",
  NOT_CENTERED: "NOT_CENTERED",
  LOW_LIGHT: "LOW_LIGHT",
  TOO_FAR: "TOO_FAR",
  TOO_CLOSE: "TOO_CLOSE",
  BAD_POSE: "BAD_POSE",
  EYES_CLOSED: "EYES_CLOSED",
  BLURRY: "BLURRY",
  READY: "READY",
} as const satisfies Record<string, IqaState>;

export interface IqaFeedback {
  p: number;
  text: string;
  kind: "active" | "warn" | "ok";
}

export const IQA_FEEDBACK: Record<IqaState, IqaFeedback> = {
  NO_FACE: { p: 1, text: "Posisikan wajah di dalam bingkai", kind: "active" },
  NOT_CENTERED: { p: 1.5, text: "Geser wajah tepat ke tengah lingkaran", kind: "warn" },
  LOW_LIGHT: { p: 2, text: "Pencahayaan kurang — cari tempat terang", kind: "warn" },
  EYES_CLOSED: { p: 3, text: "Buka kedua mata Anda", kind: "warn" },
  BAD_POSE: { p: 4, text: "Hadapkan wajah lurus ke kamera", kind: "warn" },
  TOO_FAR: { p: 5, text: "Dekatkan wajah ke kamera", kind: "warn" },
  TOO_CLOSE: { p: 6, text: "Jauhkan sedikit dari kamera", kind: "warn" },
  BLURRY: { p: 7, text: "Tahan posisi — kamera sedang menyesuaikan fokus", kind: "warn" },
  READY: { p: 99, text: "Wajah terdeteksi", kind: "ok" },
};

export const IQA_THRESHOLDS = {
  FACE_AREA_MIN: 0.025,
  FACE_AREA_MAX: 0.45,
  CENTER_TOLERANCE: 0.15,
  YAW_MAX: 0.035,
  PITCH_MAX: 0.04,
  EAR_MIN: 0.18,
  BLUR_LAPLACIAN_MIN: 25,
  BLUR_DELTA_MAX: 180,
  BLUR_WINDOW_SIZE: 8,
  READY_FRAMES: 45,
  FAIL_FRAMES: 15,
  MSG_COOLDOWN_MS: 400,
} as const;

export const BRIGHTNESS_THRESHOLD = SCAN_CONFIG.brightnessThreshold;
export const BRIGHTNESS_INTERVAL_MS = 120;

export const SCAN_GEOMETRY = {
  NUM_SEGMENTS: 60,
  ANGLE_STEP: 6,
  RADIUS_INNER: 135,
  RADIUS_OUTER: 155,
  CENTER: 200,
  VIDEO_DISPLAY_SIZE: 400,
} as const;

export const REDIRECT_DELAY_SECONDS = SCAN_CONFIG.redirectDelay;

export const ACTIVE_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  PHASES.CAPTURING,
  PHASES.ANALYZING,
]);

export const TERMINAL_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  PHASES.COMPLETE,
  PHASES.FAILED,
]);

export const CANVAS_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  PHASES.SEARCHING,
  PHASES.MORPHING,
  PHASES.SCANNING,
  PHASES.CAPTURING,
  PHASES.PREVIEW,
  PHASES.ANALYZING,
]);

export const VIGNETTE_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  PHASES.SCANNING,
  PHASES.CAPTURING,
  PHASES.PREVIEW,
  PHASES.ANALYZING,
  PHASES.COMPLETE,
  PHASES.FAILED,
]);

export const IQA_PHASES: ReadonlySet<Phase> = new Set<Phase>([
  PHASES.SEARCHING,
  PHASES.MORPHING,
  PHASES.SCANNING,
  PHASES.CAPTURING,
]);

export const DEFAULT_AURA_CONFIG: AuraConfig = {
  globalSpeed: 1.0,
  baseRadiusScale: 0.35,
  expression: "normal",
  layers: [
    { id: 1, name: "Outer Indigo", hex: "#5e5ce6", width: 8, blur: 50, w1: 2, w2: 3, amp1: 6, amp2: 5, s1: 0.015, s2: 0.025 },
    { id: 2, name: "Neon Pink", hex: "#ff2a5f", width: 6, blur: 40, w1: 3, w2: 1, amp1: 4, amp2: 7, s1: -0.02, s2: 0.015 },
    { id: 3, name: "Core Orange", hex: "#ff6b00", width: 4, blur: 30, w1: 1, w2: 4, amp1: 8, amp2: 4, s1: 0.03, s2: -0.02 },
    { id: 4, name: "Inner Glow", hex: "#ffffff", width: 2, blur: 20, w1: 2, w2: 2, amp1: 3, amp2: 4, s1: 0.04, s2: -0.03 },
  ],
};

export const FAS_CLASSES = [
  "fake_mannequin",
  "fake_mask",
  "fake_papercut",
  "fake_printed",
  "fake_screen",
  "realperson",
] as const;

export type FasClass = (typeof FAS_CLASSES)[number];

export const FAS_LABELS: Record<FasClass, string> = {
  fake_mannequin: "Mannequin",
  fake_mask: "Mask",
  fake_papercut: "Paper Cut",
  fake_printed: "Printed",
  fake_screen: "Screen",
  realperson: "Real Person",
};

export const MODE_REGISTER = "register" as const satisfies ScanMode;
export const MODE_AUTHENTICATE = "authenticate" as const satisfies ScanMode;

export const MEDIAPIPE_SCRIPT_URLS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
] as const;
