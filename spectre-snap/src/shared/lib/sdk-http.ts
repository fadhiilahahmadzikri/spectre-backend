import { getBaseUrl } from "@/lib/config";
import { isAbortError } from "@/shared/lib/http";
import {
  SpectreError,
  normalizeErrorEnvelope,
  type SpectreErrorEnvelope,
} from "./sdk-errors";

export interface SdkRequestInit extends Omit<RequestInit, "body"> {
  baseUrl?: string;
  body?: unknown;
}

export interface SdkJsonResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: SpectreError | null;
}

export const DEFAULT_SPECTRE_BASE_URL =
  "https://thewhitenigs-spectre-backend.hf.space";

export function resolveSpectreBaseUrl(baseUrl?: string): string {
  const source = baseUrl?.trim() || getBaseUrl() || DEFAULT_SPECTRE_BASE_URL;
  return source.replace(/\/+$/, "");
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers;
}

async function readJson(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

export async function requestSpectreJson<T>(
  path: string,
  init: SdkRequestInit = {},
): Promise<SdkJsonResponse<T>> {
  try {
    const res = await fetch(`${resolveSpectreBaseUrl(init.baseUrl)}${path}`, {
      ...init,
      body: serializeBody(init.body),
      headers: normalizeHeaders(init.headers),
    });
    const body = await readJson(res);

    if (!res.ok) {
      const envelope = normalizeErrorEnvelope(res.status, body, res.statusText);
      return {
        ok: false,
        status: res.status,
        data: null,
        error: new SpectreError(res.status, envelope),
      };
    }

    return {
      ok: true,
      status: res.status,
      data: body as T,
      error: null,
    };
  } catch (err) {
    if (isAbortError(err)) throw err;
    const envelope: SpectreErrorEnvelope = {
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Network error",
    };
    return {
      ok: false,
      status: 0,
      data: null,
      error: new SpectreError(0, envelope),
    };
  }
}
