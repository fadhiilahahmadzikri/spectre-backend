export type SpectreErrorCode =
  | "API_KEY_MISSING"
  | "NETWORK_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "LIVENESS_CHECK_FAILED"
  | "FACE_MATCH_FAILED"
  | "FACE_ALREADY_REGISTERED"
  | "FACE_PROFILE_NOT_FOUND"
  | "SERVER_ERROR"
  | "UNKNOWN";

export interface SpectreErrorEnvelope {
  code: SpectreErrorCode | string;
  message: string;
  details?: unknown;
  request_id?: string | null;
  timestamp?: string | null;
}

export class SpectreError extends Error {
  readonly code: SpectreErrorCode | string;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string | null;
  readonly timestamp?: string | null;

  constructor(status: number, envelope: SpectreErrorEnvelope) {
    super(envelope.message);
    this.name = "SpectreError";
    this.code = envelope.code;
    this.status = status;
    this.details = envelope.details;
    this.requestId = envelope.request_id;
    this.timestamp = envelope.timestamp;
  }
}

export function codeFromStatus(status: number): SpectreErrorCode {
  if (status === 0) return "NETWORK_ERROR";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN";
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" || value === null ? value : null;
}

function codeFromPayload(
  payload: Record<string, unknown>,
  status: number,
): SpectreErrorCode | string {
  if (typeof payload.code === "string") return payload.code;
  if (typeof payload.error_code === "string") return payload.error_code;
  return codeFromStatus(status);
}

export function normalizeErrorEnvelope(
  status: number,
  body: unknown,
  fallbackMessage: string,
): SpectreErrorEnvelope {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const requestId = stringOrNull(record.request_id);
    const timestamp = stringOrNull(record.timestamp);
    const error = record.error;
    if (error && typeof error === "object") {
      const payload = error as Record<string, unknown>;
      return {
        code: codeFromPayload(payload, status),
        message:
          typeof payload.message === "string"
            ? payload.message
            : fallbackMessage,
        details: payload.details,
        request_id: requestId ?? stringOrNull(payload.request_id),
        timestamp: timestamp ?? stringOrNull(payload.timestamp),
      };
    }

    const detail = record.detail;
    if (typeof detail === "string") {
      return {
        code: codeFromStatus(status),
        message: detail,
      };
    }
    if (detail && typeof detail === "object") {
      const payload = detail as Record<string, unknown>;
      return {
        code: codeFromPayload(payload, status),
        message:
          typeof payload.message === "string"
            ? payload.message
            : fallbackMessage,
        details: payload.details,
        request_id: requestId ?? stringOrNull(payload.request_id),
        timestamp: timestamp ?? stringOrNull(payload.timestamp),
      };
    }

    if (typeof record.message === "string") {
      return {
        code: codeFromStatus(status),
        message: record.message,
      };
    }
  }

  return {
    code: codeFromStatus(status),
    message: fallbackMessage,
  };
}
