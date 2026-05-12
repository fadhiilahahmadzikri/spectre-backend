/**
 * Thin typed wrapper around `fetch` that:
 *   • forwards an `AbortSignal` into the underlying request
 *   • serializes plain objects as JSON
 *   • distinguishes `AbortError` from network errors
 *   • normalizes non-2xx responses into an `HttpError` carrying the raw detail
 *
 * Application-level concerns (auth header injection, base URL, 401 handling)
 * live in the callers (`lib/api.ts`, `features/face-scan/api/face-client.ts`).
 */

export interface AbortableRequestInit extends Omit<RequestInit, "body"> {
  signal?: AbortSignal;
  body?: unknown;
}

export class HttpError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.detail = detail;
  }
}

export function isAbortError(err: unknown): err is DOMException {
  return err instanceof DOMException && err.name === "AbortError";
}

function serializeBody(body: unknown): BodyInit | null | undefined {
  if (body === undefined) return undefined;
  if (body === null) return null;
  if (typeof body === "string") return body;
  if (body instanceof FormData) return body;
  if (body instanceof Blob) return body;
  if (body instanceof ArrayBuffer) return body;
  return JSON.stringify(body);
}

interface ErrorShape {
  detail?: string | { message?: string };
  message?: string;
}

function extractErrorMessage(detail: unknown, fallback: string): string {
  if (!detail || typeof detail !== "object") return fallback;
  const e = detail as ErrorShape;
  if (typeof e.detail === "string") return e.detail;
  if (e.detail && typeof e.detail === "object" && typeof e.detail.message === "string") {
    return e.detail.message;
  }
  if (typeof e.message === "string") return e.message;
  return fallback;
}

export async function abortableRequest<T>(
  url: string,
  init: AbortableRequestInit = {},
): Promise<T> {
  const body = serializeBody(init.body);
  const res = await fetch(url, {
    ...init,
    body,
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new HttpError(res.status, extractErrorMessage(detail, res.statusText), detail);
  }

  return (await res.json()) as T;
}
