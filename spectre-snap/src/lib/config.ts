export const ENV = {
  LOCAL: "http://localhost:8000",
  HF_SPACES: "https://thewhitenigs-spectre-backend.hf.space",
} as const;

const STORAGE_KEY = "spectre_env";

// Runtime override — set by SpectreAuth component, not persisted.
let _runtimeBaseUrl: string | null = null;

/**
 * Set a non-persisted base URL override.
 * Used by the Snap SDK when consumers pass a `baseUrl` prop.
 */
export function setRuntimeBaseUrl(url: string) {
  _runtimeBaseUrl = url;
}

/** Clear the runtime override (on component unmount). */
export function clearRuntimeBaseUrl() {
  _runtimeBaseUrl = null;
}

export function getBaseUrl(): string {
  // Runtime override takes precedence (Snap SDK)
  if (_runtimeBaseUrl) return _runtimeBaseUrl;
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
