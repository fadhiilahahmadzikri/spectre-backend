import { getBaseUrl } from "./config";
import { useAuthStore, type AuthUser } from "./store";
import { HttpError, isAbortError } from "@/shared/lib/http";

export interface Application {
  id: string;
  name: string;
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

  login: async (data: { email: string; password: string }, opts: RequestOpts = {}) => {
    const resp = await request<{
      access_token: string;
      refresh_token: string;
      user_id: string;
      display_name: string;
      token_type: string;
      expires_in: number;
      totp_required: boolean;
    }>("/api/v1/auth/login", { method: "POST", body: data, signal: opts.signal });

    // Decode role from JWT payload since backend doesn't return it at top level
    let role = "user";
    try {
      const payload = JSON.parse(atob(resp.access_token.split(".")[1]));
      role = payload.role ?? "user";
    } catch { /* keep default */ }

    return {
      access_token: resp.access_token,
      refresh_token: resp.refresh_token,
      user: {
        id: resp.user_id,
        email: data.email,
        display_name: resp.display_name,
        role,
      } as AuthUser,
    };
  },

  googleLogin: () => `${getBaseUrl()}/api/v1/auth/oauth/google`,

  listApps: (opts: RequestOpts = {}) =>
    request<{ data: Application[]; pagination: Pagination }>(
      "/api/v1/applications",
      { signal: opts.signal },
    ),

  createApp: (
    data: { name: string },
    opts: RequestOpts = {},
  ) =>
    request<Application>("/api/v1/applications", {
      method: "POST",
      body: data,
      signal: opts.signal,
    }),

  updateApp: (
    id: string,
    data: Partial<Pick<Application, "name">>,
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

  // ─── Admin Monitoring ──────────────────────────────────────────────

  adminListUsers: (page = 1, pageSize = 20, opts: RequestOpts = {}) =>
    request<{ data: AdminUser[]; pagination: Pagination }>(`/admin/users?page=${page}&page_size=${pageSize}`, { signal: opts.signal }),

  adminGetUser: (userId: string, opts: RequestOpts = {}) =>
    request<AdminUser>(`/admin/users/${userId}`, { signal: opts.signal }),

  adminUpdateUser: (userId: string, data: Partial<AdminUser>, opts: RequestOpts = {}) =>
    request<AdminUser>(`/admin/users/${userId}`, { method: "PATCH", body: data, signal: opts.signal }),

  adminDeleteUser: (userId: string, opts: RequestOpts = {}) =>
    request<void>(`/admin/users/${userId}`, { method: "DELETE", signal: opts.signal }),

  adminListAllApps: (page = 1, pageSize = 20, opts: RequestOpts = {}) =>
    request<{ data: AdminApplication[]; pagination: Pagination }>(`/admin/applications?page=${page}&page_size=${pageSize}`, { signal: opts.signal }),

  adminUpdateApp: (appId: string, data: Record<string, unknown>, opts: RequestOpts = {}) =>
    request<Record<string, unknown>>(`/admin/applications/${appId}`, { method: "PATCH", body: data, signal: opts.signal }),

  adminDeleteApp: (appId: string, opts: RequestOpts = {}) =>
    request<void>(`/admin/applications/${appId}`, { method: "DELETE", signal: opts.signal }),

  adminListAllApiKeys: (page = 1, pageSize = 20, opts: RequestOpts = {}) =>
    request<{ data: AdminApiKey[]; pagination: Pagination }>(`/admin/api-keys?page=${page}&page_size=${pageSize}`, { signal: opts.signal }),

  adminRevokeApiKey: (keyId: string, opts: RequestOpts = {}) =>
    request<void>(`/admin/api-keys/${keyId}/revoke`, { method: "POST", signal: opts.signal }),

  adminDeleteApiKey: (keyId: string, opts: RequestOpts = {}) =>
    request<void>(`/admin/api-keys/${keyId}`, { method: "DELETE", signal: opts.signal }),

  adminListFaceProfiles: (page = 1, pageSize = 20, appId?: string, opts: RequestOpts = {}) =>
    request<{ data: AdminFaceProfile[]; pagination: Pagination }>(
      `/admin/face-profiles?page=${page}&page_size=${pageSize}${appId ? `&app_id=${appId}` : ""}`,
      { signal: opts.signal },
    ),

  adminDeleteFaceProfile: (profileId: string, opts: RequestOpts = {}) =>
    request<void>(`/admin/face-profiles/${profileId}`, { method: "DELETE", signal: opts.signal }),

  adminListSessions: (page = 1, pageSize = 20, opts: RequestOpts = {}) =>
    request<{ data: AdminSession[]; pagination: Pagination }>(`/admin/sessions?page=${page}&page_size=${pageSize}`, { signal: opts.signal }),
};

// ─── Admin Types ──────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  totp_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminApplication {
  id: string;
  owner_id: string;
  name: string;
  status: string;
  liveness_threshold: number;
  similarity_threshold: number;
  allowed_ips: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminApiKey {
  id: string;
  app_id: string;
  key_prefix: string;
  label: string | null;
  status: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  revoked_at: string | null;
}

export interface AdminFaceProfile {
  id: string;
  app_id: string;
  external_user_id: string;
  model_version: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminSession {
  id: string;
  app_id: string;
  session_type: string;
  status: string;
  external_user_id: string;
  liveness_class: string | null;
  liveness_confidence: number | null;
  similarity_score: number | null;
  inference_time_ms: number | null;
  created_at: string | null;
  completed_at: string | null;
}
