const REDIRECT_STORAGE_KEY = "spectre_scan_redirect_url";
const DEFAULT_REDIRECT_URL = "";

export interface ScanConfig {
  redirectUrl: string;
  redirectDelay: number;
  apiUrl: string;
  brightnessThreshold: number;
}

function getPersistedRedirectUrl(): string {
  if (typeof window === "undefined") return DEFAULT_REDIRECT_URL;
  return localStorage.getItem(REDIRECT_STORAGE_KEY) || DEFAULT_REDIRECT_URL;
}

export function setPersistedRedirectUrl(url: string): void {
  localStorage.setItem(REDIRECT_STORAGE_KEY, url);
}

export const SCAN_CONFIG: Readonly<ScanConfig> = Object.freeze({
  redirectUrl: getPersistedRedirectUrl(),
  redirectDelay: Number(import.meta.env.VITE_SCAN_REDIRECT_DELAY) || 5,
  apiUrl:
    import.meta.env.VITE_SCAN_API_URL ||
    "https://thewhitenigs-spectre-backend.hf.space/api/v1/faces",
  brightnessThreshold: 55,
});
