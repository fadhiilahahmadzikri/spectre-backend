import { getBaseUrl } from "./config";
import { useAuthStore, type AuthUser } from "./store";

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

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const base = getBaseUrl();
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...opts, headers });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ detail: res.statusText }))) as ApiError;
    const detail = err.detail;
    if (typeof detail === "string") throw new Error(detail);
    throw new Error(detail?.message ?? JSON.stringify(err));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (data: { email: string; password: string; display_name?: string }) =>
    request<{ user_id: string }>("/api/v1/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; refresh_token: string; user: AuthUser }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify(data) },
    ),

  verifyEmail: (data: { email: string; otp_code: string }) =>
    request<{ message: string }>("/api/v1/auth/verify-email", { method: "POST", body: JSON.stringify(data) }),

  resendOtp: (data: { email: string }) =>
    request<{ message: string }>("/api/v1/auth/resend-otp", { method: "POST", body: JSON.stringify(data) }),

  googleLogin: () => `${getBaseUrl()}/api/v1/auth/oauth/google`,

  listApps: () => request<{ data: Application[]; pagination: Pagination }>("/api/v1/applications"),

  createApp: (data: { name: string; webhook_url?: string }) =>
    request<Application>("/api/v1/applications", { method: "POST", body: JSON.stringify(data) }),

  updateApp: (id: string, data: Partial<Pick<Application, "name" | "webhook_url">>) =>
    request<Application>(`/api/v1/applications/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteApp: (id: string) =>
    request<void>(`/api/v1/applications/${id}`, { method: "DELETE" }),

  listKeys: (appId: string) => request<{ data: ApiKeyRow[] }>(`/api/v1/applications/${appId}/api-keys`),

  generateKey: (appId: string) =>
    request<{ id: string; full_key: string; key_prefix: string }>(
      `/api/v1/applications/${appId}/api-keys`,
      { method: "POST" },
    ),

  revokeKey: (appId: string, keyId: string) =>
    request<void>(`/api/v1/applications/${appId}/api-keys/${keyId}`, { method: "DELETE" }),

  getHealth: () =>
    request<{
      status: string;
      service: string;
      version: string;
      timestamp: string;
      components: { database: string; redis: string; ml_model: string };
    }>("/health"),

  getAdminStats: () =>
    request<{
      heartbeats: Array<{ id: string; pinged_at: string; source: string }>;
      server_time: string;
      active_db: string;
    }>("/admin/stats"),

  switchDatabase: (target: string) =>
    request<{ status: string; message: string }>("/admin/config/db", {
      method: "POST",
      body: JSON.stringify({ target }),
    }),

  getAdminEnv: () =>
    request<Record<string, string>>("/admin/env"),

  getAutomationStatus: () =>
    request<{
      workflow: string;
      last_run_at: string;
      status: string;
      conclusion: string;
      html_url: string;
      repo: string;
      cron_interval: string;
      error?: string;
    }>("/admin/automation/status"),

  getConfig: () =>
    request<{ categories: Record<string, Array<{ key: string; value: string; category: string; data_type: string; description: string; updated_by: string | null; updated_at: string | null }>> }>("/admin/config"),

  updateConfig: (updates: Record<string, string>) =>
    request<{ categories: Record<string, Array<{ key: string; value: string; category: string; data_type: string; description: string; updated_by: string | null; updated_at: string | null }>> }>("/admin/config", {
      method: "PATCH",
      body: JSON.stringify({ updates }),
    }),
};
