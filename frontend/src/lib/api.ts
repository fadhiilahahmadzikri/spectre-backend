import { getBaseUrl } from "./config";
import { useAuthStore, type AuthUser } from "./store";
import { HttpError, isAbortError } from "@/shared/lib/http";

export interface Application {
  id: string;
  name: string;
  webhook_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ApiKeyRow {
  id: string;
  key_prefix: string;
  label?: string | null;
  status?: "active" | "revoked" | "grace_period";
  created_at: string;
  revoked_at?: string | null;
  last_used_at?: string | null;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

export interface ApiError {
  detail?: string | { message?: string };
}

export interface RequestOpts {
  signal?: AbortSignal;
}

interface InternalRequestOpts extends RequestOpts {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

async function request<T>(path: string, opts: InternalRequestOpts = {}): Promise<T> {
  const base = getBaseUrl();
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: opts.method,
      headers,
      body: serializeBody(opts.body),
      signal: opts.signal,
    });
  } catch (err) {
    // Let AbortError surface as-is so react-query treats it as a cancellation.
    if (isAbortError(err)) throw err;
    throw new Error(err instanceof Error ? err.message : "Network error", {
      cause: err,
    });
  }

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new HttpError(401, "Unauthorized");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ detail: res.statusText }))) as ApiError;
    const detail = body.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message ?? JSON.stringify(body);
    throw new HttpError(res.status, message, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (
    data: { email: string; password: string; display_name?: string },
    opts: RequestOpts = {},
  ) =>
    request<{ user_id: string }>("/api/v1/auth/register", {
      method: "POST",
      body: data,
      signal: opts.signal,
    }),

  login: (data: { email: string; password: string }, opts: RequestOpts = {}) =>
    request<{ access_token: string; refresh_token: string; user: AuthUser }>(
      "/api/v1/auth/login",
      { method: "POST", body: data, signal: opts.signal },
    ),

  verifyEmail: (data: { email: string; otp_code: string }, opts: RequestOpts = {}) =>
    request<{ message: string }>("/api/v1/auth/verify-email", {
      method: "POST",
      body: data,
      signal: opts.signal,
    }),

  resendOtp: (data: { email: string }, opts: RequestOpts = {}) =>
    request<{ message: string }>("/api/v1/auth/resend-otp", {
      method: "POST",
      body: data,
      signal: opts.signal,
    }),

  googleLogin: () => `${getBaseUrl()}/api/v1/auth/oauth/google`,

  listApps: (opts: RequestOpts = {}) =>
    request<{ data: Application[]; pagination: Pagination }>(
      "/api/v1/applications",
      { signal: opts.signal },
    ),

  createApp: (
    data: { name: string; webhook_url?: string },
    opts: RequestOpts = {},
  ) =>
    request<Application>("/api/v1/applications", {
      method: "POST",
      body: data,
      signal: opts.signal,
    }),

  updateApp: (
    id: string,
    data: Partial<Pick<Application, "name" | "webhook_url">>,
    opts: RequestOpts = {},
  ) =>
    request<Application>(`/api/v1/applications/${id}`, {
      method: "PATCH",
      body: data,
      signal: opts.signal,
    }),

  deleteApp: (id: string, opts: RequestOpts = {}) =>
    request<void>(`/api/v1/applications/${id}`, {
      method: "DELETE",
      signal: opts.signal,
    }),

  listKeys: (appId: string, opts: RequestOpts = {}) =>
    request<{ data: ApiKeyRow[] }>(`/api/v1/applications/${appId}/api-keys`, {
      signal: opts.signal,
    }),

  generateKey: (appId: string, opts: RequestOpts = {}) =>
    request<{ id: string; full_key: string; key_prefix: string }>(
      `/api/v1/applications/${appId}/api-keys`,
      { method: "POST", signal: opts.signal },
    ),

  revokeKey: (appId: string, keyId: string, opts: RequestOpts = {}) =>
    request<void>(`/api/v1/applications/${appId}/api-keys/${keyId}/revoke`, {
      method: "POST",
      signal: opts.signal,
    }),

  deleteKey: (appId: string, keyId: string, opts: RequestOpts = {}) =>
    request<void>(`/api/v1/applications/${appId}/api-keys/${keyId}`, {
      method: "DELETE",
      signal: opts.signal,
    }),

  getHealth: (opts: RequestOpts = {}) =>
    request<{
      status: string;
      service: string;
      version: string;
      timestamp: string;
      components: { database: string; redis: string; ml_model: string };
    }>("/health", { signal: opts.signal }),

  getMlStatus: (opts: RequestOpts = {}) =>
    request<{
      active_model_id: string;
      active_model: {
        model_id: string;
        version: string;
        supports_tta: boolean;
      } | null;
      benchmark_enabled: boolean;
      benchmark_models: string[];
      detail_mode_default: boolean;
    }>("/health/ml-status", { signal: opts.signal }),

  getAdminStats: (opts: RequestOpts = {}) =>
    request<{
      heartbeats: Array<{ id: string; pinged_at: string; source: string }>;
      server_time: string;
      active_db: string;
    }>("/admin/stats", { signal: opts.signal }),

  switchDatabase: (target: string, opts: RequestOpts = {}) =>
    request<{ status: string; message: string }>("/admin/config/db", {
      method: "POST",
      body: { target },
      signal: opts.signal,
    }),

  getAdminEnv: (opts: RequestOpts = {}) =>
    request<Record<string, string>>("/admin/env", { signal: opts.signal }),

  getAutomationStatus: (opts: RequestOpts = {}) =>
    request<{
      workflow: string;
      last_run_at: string;
      status: string;
      conclusion: string;
      html_url: string;
      repo: string;
      cron_interval: string;
      error?: string;
    }>("/admin/automation/status", { signal: opts.signal }),

  getConfig: (opts: RequestOpts = {}) =>
    request<{
      categories: Record<
        string,
        Array<{
          key: string;
          value: string;
          category: string;
          data_type: string;
          description: string;
          updated_by: string | null;
          updated_at: string | null;
        }>
      >;
    }>("/admin/config", { signal: opts.signal }),

  getFasModels: (opts: RequestOpts = {}) =>
    request<{
      active_model_id: string;
      loaded_count: number;
      benchmark_enabled: boolean;
      benchmark_models: string[];
      models: Array<{
        model_id: string;
        version: string;
        description: string;
        is_loaded: boolean;
        supports_tta: boolean;
        is_active: boolean;
        in_benchmark: boolean;
        load_error: string | null;
      }>;
    }>("/admin/fas-models", { signal: opts.signal }),

  updateConfig: (updates: Record<string, string>, opts: RequestOpts = {}) =>
    request<{
      categories: Record<
        string,
        Array<{
          key: string;
          value: string;
          category: string;
          data_type: string;
          description: string;
          updated_by: string | null;
          updated_at: string | null;
        }>
      >;
    }>("/admin/config", {
      method: "PATCH",
      body: { updates },
      signal: opts.signal,
    }),
};
