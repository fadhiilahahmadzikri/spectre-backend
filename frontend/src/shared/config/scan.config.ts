export interface ScanConfig {
  redirectUrl: string | null;
  redirectDelay: number;
  apiUrl: string;
  brightnessThreshold: number;
}

export const SCAN_CONFIG: Readonly<ScanConfig> = Object.freeze({
  redirectUrl: import.meta.env.VITE_SCAN_REDIRECT_URL || null,
  redirectDelay: Number(import.meta.env.VITE_SCAN_REDIRECT_DELAY) || 5,
  apiUrl:
    import.meta.env.VITE_SCAN_API_URL ||
    "https://thewhitenigs-spectre-backend.hf.space/api/v1/faces",
  brightnessThreshold: 55,
});
