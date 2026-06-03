import { requestSpectreJson, resolveSpectreBaseUrl } from "@/shared/lib/sdk-http";
import { SpectreError } from "@/shared/lib/sdk-errors";
import { maskKey, scanDebug, scanError } from "../lib/scan-debug";
import type {
  BenchmarkApiResponse,
  FaceApiErrorPayload,
  FaceApiSuccessPayload,
} from "../model/types";

export interface FaceApiResponse<T = FaceApiSuccessPayload & FaceApiErrorPayload> {
  ok: boolean;
  status: number;
  data: T | null;
}

export interface FaceProfile {
  external_user_id: string;
  created_at: string;
}

interface FacePayload {
  external_user_id: string;
  image: string;
  metadata: { source: string; bypass_fas: boolean };
  detail_mode?: boolean;
}

export interface FaceRequestOpts {
  signal?: AbortSignal;
  idempotencyKey?: string;
}

interface FaceApiClientOptions {
  baseUrl?: string;
}

const ENDPOINT_BASE = "/api/v1/faces";

/**
 * Scanner API client.
 *
 * Accepts a per-instance `baseUrl` so embedded SDK mounts do not mutate
 * shared module state. If omitted, it falls back to the demo app environment.
 */
export class FaceApiClient {
  private readonly headers: Record<string, string>;
  private readonly apiKey: string;
  private readonly baseUrl?: string;

  constructor(apiKey: string, options: FaceApiClientOptions = {}) {
    this.apiKey = apiKey;
    this.baseUrl = options.baseUrl;
    this.headers = {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & FaceRequestOpts = {},
  ): Promise<FaceApiResponse<T>> {
    const res = await requestSpectreJson<T & FaceApiErrorPayload>(
      `${ENDPOINT_BASE}${endpoint}`,
      {
        ...options,
        baseUrl: this.baseUrl,
        headers: {
          ...this.headers,
          ...(options.idempotencyKey
            ? { "Idempotency-Key": options.idempotencyKey }
            : {}),
          ...(options.headers as Record<string, string>),
        },
      },
    );

    if (res.error) {
      return {
        ok: false,
        status: res.status,
        data: {
          error: {
            code: res.error.code,
            message: res.error.message,
            details: res.error.details,
            request_id: res.error.requestId,
            timestamp: res.error.timestamp,
          },
        } as T,
      };
    }

    return { ok: res.ok, status: res.status, data: res.data };
  }

  private payload(
    externalUserId: string,
    imageBase64: string,
    fas: boolean,
    detailMode: boolean = false,
  ): FacePayload {
    return {
      external_user_id: externalUserId,
      image: imageBase64,
      metadata: { source: "web_ui", bypass_fas: !fas },
      detail_mode: detailMode,
    };
  }

  register(
    externalUserId: string,
    imageBase64: string,
    fas: boolean,
    opts: FaceRequestOpts & { detailMode?: boolean } = {},
  ) {
    scanDebug("FaceApiClient.register →", {
      apiKey: maskKey(this.apiKey),
      externalUserId,
      fas,
      detailMode: opts.detailMode ?? false,
    });
    const p = this.request<FaceApiSuccessPayload & FaceApiErrorPayload>("/register", {
      method: "POST",
      body: JSON.stringify(this.payload(externalUserId, imageBase64, fas, opts.detailMode)),
      signal: opts.signal,
      idempotencyKey: opts.idempotencyKey,
    });
    p.then((res) => {
      scanDebug("FaceApiClient.register ←", {
        apiKey: maskKey(this.apiKey),
        ok: res.ok,
        status: res.status,
        errorCode: res.data?.error?.code ?? null,
      });
    }).catch(() => {});
    return p;
  }

  authenticate(
    externalUserId: string,
    imageBase64: string,
    fas: boolean,
    opts: FaceRequestOpts & { detailMode?: boolean } = {},
  ) {
    scanDebug("FaceApiClient.authenticate →", {
      apiKey: maskKey(this.apiKey),
      externalUserId,
      fas,
      detailMode: opts.detailMode ?? false,
    });
    const p = this.request<FaceApiSuccessPayload & FaceApiErrorPayload>("/authenticate", {
      method: "POST",
      body: JSON.stringify(this.payload(externalUserId, imageBase64, fas, opts.detailMode)),
      signal: opts.signal,
      idempotencyKey: opts.idempotencyKey,
    });
    p.then((res) => {
      scanDebug("FaceApiClient.authenticate ←", {
        apiKey: maskKey(this.apiKey),
        ok: res.ok,
        status: res.status,
        errorCode: res.data?.error?.code ?? null,
      });
    }).catch(() => {});
    return p;
  }

  listProfiles(opts: FaceRequestOpts = {}) {
    const p = this.request<{ profiles?: FaceProfile[] }>("", {
      signal: opts.signal,
      idempotencyKey: opts.idempotencyKey,
    });
    p.then((res) => {
      scanDebug("FaceApiClient.listProfiles", {
        apiKey: maskKey(this.apiKey),
        ok: res.ok,
        status: res.status,
        count: Array.isArray(res.data?.profiles) ? res.data!.profiles!.length : null,
        profiles: res.data?.profiles ?? null,
      });
    }).catch(() => {});
    return p;
  }

  benchmark(
    imageBase64: string,
    externalUserId: string | null,
    opts: FaceRequestOpts = {},
  ) {
    return this.request<BenchmarkApiResponse>("/benchmark", {
      method: "POST",
      body: JSON.stringify({
        image: imageBase64,
        external_user_id: externalUserId,
      }),
      signal: opts.signal,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  deleteProfile(externalUserId: string, opts: FaceRequestOpts = {}) {
    return this.request<FaceApiSuccessPayload>(`/${externalUserId}`, {
      method: "DELETE",
      signal: opts.signal,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  purgeAll(opts: FaceRequestOpts = {}) {
    return this.request<{ purged_count?: number }>("", {
      method: "DELETE",
      signal: opts.signal,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  async lookupUser(
    externalUserId: string,
    opts: FaceRequestOpts = {},
  ): Promise<boolean> {
    scanDebug("FaceApiClient.lookupUser →", {
      apiKey: maskKey(this.apiKey),
      externalUserId,
    });
    const res = await this.request<{ exists: boolean }>(
      `/${encodeURIComponent(externalUserId)}/exists`,
      { signal: opts.signal, idempotencyKey: opts.idempotencyKey },
    );
    scanDebug("FaceApiClient.lookupUser ←", {
      apiKey: maskKey(this.apiKey),
      externalUserId,
      ok: res.ok,
      status: res.status,
      body: res.data,
    });
    if (!res.ok || !res.data) {
      scanError("FaceApiClient.lookupUser failed", {
        apiKey: maskKey(this.apiKey),
        externalUserId,
        status: res.status,
        body: res.data,
      });
      throw new Error(`face_exists_lookup_failed_status_${res.status}`);
    }
    return Boolean(res.data.exists);
  }

  async validate(opts: FaceRequestOpts = {}): Promise<boolean> {
    const res = await this.listProfiles(opts);
    scanDebug("FaceApiClient.validate", {
      apiKey: maskKey(this.apiKey),
      ok: res.ok,
      status: res.status,
    });
    return res.ok;
  }
}

export interface MlStatus {
  active_model_id: string;
  active_model: {
    model_id: string;
    version: string;
    supports_tta: boolean;
  } | null;
  benchmark_enabled: boolean;
  benchmark_models: string[];
  detail_mode_default: boolean;
}

export async function getMlStatus(
  opts: { baseUrl?: string; signal?: AbortSignal } = {},
): Promise<MlStatus> {
  const res = await requestSpectreJson<MlStatus>("/health/ml-status", {
    baseUrl: opts.baseUrl,
    signal: opts.signal,
  });
  if (res.error) throw res.error;
  if (!res.data) {
    throw new SpectreError(res.status, {
      code: "UNKNOWN",
      message: "Empty ML status response",
    });
  }
  return res.data;
}

export function getFaceClientBaseUrl(baseUrl?: string): string {
  return resolveSpectreBaseUrl(baseUrl);
}
