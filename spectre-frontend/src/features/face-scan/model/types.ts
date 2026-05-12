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

export type AuraExpression =
  | "normal"
  | "senang"
  | "sedih"
  | "lengkungan"
  | "berhasil"
  | "gagal"
  | "berhasil_anticipate"
  | "berhasil_static"
  | "gagal_anticipate"
  | "gagal_static";

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
      diagnostics?: InferenceDiagnostics | null;
    };
  };
}

export interface FaceApiSuccessPayload {
  metrics?: unknown[];
  session_id?: string;
  similarity_score?: number;
  inference_time_ms?: number;
  status?: string;
  diagnostics?: InferenceDiagnostics | null;
}

export interface InferenceDiagnostics {
  outcome: string;
  model: {
    model_id: string;
    version: string;
    supports_tta: boolean;
    used_tta: boolean;
  } | null;
  fas: {
    classes: string[];
    probabilities: number[];
    predicted_class: string;
    predicted_index: number;
    confidence: number;
    is_live: boolean;
    threshold_used: number;
    top_spoof_class: string | null;
    spoof_probability: number;
  } | null;
  embedding: {
    extracted: boolean;
    provider: string;
    dim: number | null;
    similarity_score: number | null;
    similarity_threshold: number | null;
    match: boolean | null;
  } | null;
  timings: {
    validation_ms: number;
    fas_inference_ms: number;
    embedding_extraction_ms: number;
    matching_ms: number;
    total_ms: number;
  };
  flags: {
    bypass_fas: boolean;
    ml_disabled: boolean;
    detail_mode: boolean;
  };
  request: {
    request_id: string | null;
    app_id: string;
    external_user_id: string | null;
    session_id: string | null;
    timestamp: string;
  };
  reason: string | null;
}

export interface BenchmarkModelResult {
  model_id: string;
  version: string;
  status: "completed" | "failed" | string;
  diagnostics: InferenceDiagnostics | null;
  error: string | null;
}

export interface BenchmarkApiResponse {
  request_id: string | null;
  benchmark_enabled: boolean;
  participating_models: string[];
  results: BenchmarkModelResult[];
  consensus: {
    is_live_agreement: boolean;
    predicted_class_agreement: boolean;
    mean_realperson_prob: number;
    std_realperson_prob: number;
    unique_predicted_classes: string[];
  } | null;
  timestamp: string;
}
