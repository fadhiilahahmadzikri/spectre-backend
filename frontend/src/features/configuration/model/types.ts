export interface ConfigItem {
  key: string;
  value: string;
  category: string;
  data_type: string;
  description: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface ConfigResponse {
  categories: Record<string, ConfigItem[]>;
}

export type ConfigDraft = Record<string, string>;

export const CATEGORY_LABELS: Record<string, string> = {
  anti_spoofing: "Anti-Spoofing & Liveness",
  webhook: "Webhook & Delivery",
  rate_limiting: "Rate Limiting",
  session_auth: "Session & Auth",
  scan_ux: "Scan UX",
};

export const CATEGORY_ORDER = [
  "anti_spoofing",
  "webhook",
  "rate_limiting",
  "session_auth",
  "scan_ux",
];
