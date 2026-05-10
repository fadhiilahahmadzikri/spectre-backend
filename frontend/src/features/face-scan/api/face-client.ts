import { getBaseUrl } from "@/lib/config";
import type {
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
}

const ENDPOINT_BASE = "/api/v1/faces";

export class FaceApiClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(apiKey: string) {
    this.baseUrl = `${getBaseUrl()}${ENDPOINT_BASE}`;
    this.headers = {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<FaceApiResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: this.headers,
      });
      const data = res.status !== 204 ? ((await res.json()) as T) : null;
      return { ok: res.ok, status: res.status, data };
    } catch {
      return {
        ok: false,
        status: 0,
        data: {
          error: { message: "Connection refused or network error" },
        } as unknown as T,
      };
    }
  }

  private payload(externalUserId: string, imageBase64: string, fas: boolean): FacePayload {
    return {
      external_user_id: externalUserId,
      image: imageBase64,
      metadata: { source: "web_ui", bypass_fas: !fas },
    };
  }

  register(externalUserId: string, imageBase64: string, fas: boolean) {
    return this.request<FaceApiSuccessPayload & FaceApiErrorPayload>("/register", {
      method: "POST",
      body: JSON.stringify(this.payload(externalUserId, imageBase64, fas)),
    });
  }

  authenticate(externalUserId: string, imageBase64: string, fas: boolean) {
    return this.request<FaceApiSuccessPayload & FaceApiErrorPayload>("/authenticate", {
      method: "POST",
      body: JSON.stringify(this.payload(externalUserId, imageBase64, fas)),
    });
  }

  listProfiles() {
    return this.request<{ profiles?: FaceProfile[] }>("");
  }

  deleteProfile(externalUserId: string) {
    return this.request<FaceApiSuccessPayload>(`/${externalUserId}`, { method: "DELETE" });
  }

  purgeAll() {
    return this.request<{ purged_count?: number }>("", { method: "DELETE" });
  }

  async lookupUser(externalUserId: string): Promise<boolean> {
    const res = await this.listProfiles();
    if (!res.ok || !res.data?.profiles) return false;
    return res.data.profiles.some((p) => p.external_user_id === externalUserId);
  }

  async validate(): Promise<boolean> {
    const res = await this.listProfiles();
    return res.ok;
  }
}
