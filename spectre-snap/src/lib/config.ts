export const ENV = {
  LOCAL: "http://localhost:8000",
  HF_SPACES: "https://thewhitenigs-spectre-backend.hf.space",
} as const;

const STORAGE_KEY = "spectre_env";

export function getBaseUrl(): string {
  if (typeof window === "undefined") return ENV.HF_SPACES;
  return localStorage.getItem(STORAGE_KEY) || ENV.HF_SPACES;
}

export function setBaseUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url);
  window.dispatchEvent(new CustomEvent("spectre:env-change", { detail: url }));
}

export type EnvName = "local" | "hf";

export function resolveEnvName(url: string): EnvName {
  return url === ENV.HF_SPACES ? "hf" : "local";
}
