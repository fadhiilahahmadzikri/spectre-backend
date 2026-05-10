export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

export interface IqaMetrics {
  hasFace: boolean;
  centerDist: number;
  luminance: number;
  blur: number;
  blurDelta: number;
  faceArea: number;
  yaw: number;
  pitch: number;
  ear: number;
}

export interface IqaResult {
  state: IqaState;
  fails: IqaFailCode[];
}

export type IqaFailCode = IqaState;

export type Phase =
  | "USER_ID"
  | "LOADING"
  | "SEARCHING"
  | "MORPHING"
  | "SCANNING"
  | "PREVIEW"
  | "CAPTURING"
  | "ANALYZING"
  | "COMPLETE"
  | "FAILED";

export type IqaState =
  | "NO_FACE"
  | "NOT_CENTERED"
  | "LOW_LIGHT"
  | "TOO_FAR"
  | "TOO_CLOSE"
  | "BAD_POSE"
  | "EYES_CLOSED"
  | "BLURRY"
  | "READY";

export type ScanMode = "register" | "authenticate";

export type ResultVerdict = "ok" | "spoof" | "warn";

export type AuraExpression = "normal" | "senang" | "sedih" | "lengkungan";

export interface AuraLayerConfig {
  id: number;
  name: string;
  hex: string;
  width: number;
  blur: number;
  w1: number;
  w2: number;
  amp1: number;
  amp2: number;
  s1: number;
  s2: number;
}

export interface AuraConfig {
  globalSpeed: number;
  baseRadiusScale: number;
  expression: AuraExpression;
  layers: AuraLayerConfig[];
}

export interface ScanSummary {
  live: number;
  spoof: number;
}

export interface ScanResult {
  verdict: ResultVerdict;
  label: string;
  summary: ScanSummary;
  detail: Record<string, number> | null;
  similarity_score?: number;
  session_id?: string;
  inference_time_ms?: number;
}

export interface LogEntry {
  id: number;
  text: string;
  kind: "ok" | "warn" | "err" | "active" | "info";
  fading?: boolean;
}

export interface FaceApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: {
      probabilities?: unknown[];
      confidence?: number;
      spoof_class?: string;
      similarity_score?: number;
    };
  };
}

export interface FaceApiSuccessPayload {
  metrics?: unknown[];
  session_id?: string;
  similarity_score?: number;
  inference_time_ms?: number;
  status?: string;
}
