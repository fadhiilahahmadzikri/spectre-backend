import { getBaseUrl } from "@/lib/config";
import { isAbortError } from "@/shared/lib/http";
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

  constructor(apiKey: string) {
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
    return this.request<FaceApiSuccessPayload & FaceApiErrorPayload>("/register", {
      method: "POST",
      body: JSON.stringify(this.payload(externalUserId, imageBase64, fas, opts.detailMode)),
      signal: opts.signal,
    });
  }

  authenticate(
    externalUserId: string,
    imageBase64: string,
    fas: boolean,
    opts: FaceRequestOpts & { detailMode?: boolean } = {},
  ) {
    return this.request<FaceApiSuccessPayload & FaceApiErrorPayload>("/authenticate", {
      method: "POST",
      body: JSON.stringify(this.payload(externalUserId, imageBase64, fas, opts.detailMode)),
      signal: opts.signal,
    });
  }

  listProfiles(opts: FaceRequestOpts = {}) {
    return this.request<{ profiles?: FaceProfile[] }>("", {
      signal: opts.signal,
    });
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
    const res = await this.listProfiles(opts);
    if (!res.ok || !res.data?.profiles) return false;
    return res.data.profiles.some((p) => p.external_user_id === externalUserId);
  }

  async validate(opts: FaceRequestOpts = {}): Promise<boolean> {
    const res = await this.listProfiles(opts);
    return res.ok;
  }
}
