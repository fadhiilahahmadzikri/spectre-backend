import { getBaseUrl } from "@/lib/config";
import { isAbortError } from "@/shared/lib/http";
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
}

const ENDPOINT_BASE = "/api/v1/faces";

/**
 * Scanner API client.
 *
 * Reads `getBaseUrl()` on every request so environment switches are picked
 * up live (the client no longer freezes a stale baseUrl at construction).
 * Accepts an `AbortSignal` per call so callers can cancel in-flight requests
 * when the scan session resets.
 */
export class FaceApiClient {
  private readonly headers: Record<string, string>;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.headers = {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & FaceRequestOpts = {},
  ): Promise<FaceApiResponse<T>> {
    const url = `${getBaseUrl()}${ENDPOINT_BASE}${endpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...this.headers, ...(options.headers as Record<string, string>) },
      });
      const data = res.status !== 204 ? ((await res.json()) as T) : null;
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      if (isAbortError(err)) throw err;
      return {
        ok: false,
        status: 0,
        data: {
          error: { message: "Connection refused or network error" },
        } as unknown as T,
      };
    }
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
    });
  }

  deleteProfile(externalUserId: string, opts: FaceRequestOpts = {}) {
    return this.request<FaceApiSuccessPayload>(`/${externalUserId}`, {
      method: "DELETE",
      signal: opts.signal,
    });
  }

  purgeAll(opts: FaceRequestOpts = {}) {
    return this.request<{ purged_count?: number }>("", {
      method: "DELETE",
      signal: opts.signal,
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
      { signal: opts.signal },
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
