const DEFAULT_REDIRECT_DELAY_SECONDS = 5;

export function normalizeRedirectDelay(delay: number | undefined): number {
  if (delay === undefined) return DEFAULT_REDIRECT_DELAY_SECONDS;
  if (!Number.isFinite(delay) || delay < 0) return DEFAULT_REDIRECT_DELAY_SECONDS;
  return Math.floor(delay);
}
