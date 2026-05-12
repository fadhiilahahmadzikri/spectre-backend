import type { SpectreTheme } from "./types";

/**
 * Resolves the theme to apply. Matches the user's system preference when
 * set to `"auto"`.
 */
export function resolveTheme(theme: SpectreTheme = "dark"): "dark" | "light" {
  if (theme !== "auto") return theme;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * CSS custom properties scoped to the `.spectre-snap` container.
 * Consumer apps can override these to customize the look.
 */
export const THEME_VARS = {
  dark: {
    "--spectre-bg": "0 0 0",
    "--spectre-surface": "14 14 18",
    "--spectre-text": "255 255 255",
    "--spectre-text-muted": "255 255 255 / 0.6",
    "--spectre-border": "255 255 255 / 0.08",
    "--spectre-accent": "94 92 230",
    "--spectre-success": "52 211 153",
    "--spectre-error": "248 113 113",
  },
  light: {
    "--spectre-bg": "250 250 250",
    "--spectre-surface": "255 255 255",
    "--spectre-text": "15 15 20",
    "--spectre-text-muted": "15 15 20 / 0.6",
    "--spectre-border": "0 0 0 / 0.08",
    "--spectre-accent": "94 92 230",
    "--spectre-success": "16 185 129",
    "--spectre-error": "239 68 68",
  },
} as const;

/** Build an inline style object from theme vars. */
export function themeStyle(
  theme: SpectreTheme = "dark",
): Record<string, string> {
  const resolved = resolveTheme(theme);
  return THEME_VARS[resolved] as unknown as Record<string, string>;
}
