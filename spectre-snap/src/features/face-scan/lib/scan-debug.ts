const TAG = "[spectre:scan]";

export function scanDebug(event: string, payload?: unknown): void {
  if (payload === undefined) {
    console.log(TAG, event);
  } else {
    console.log(TAG, event, payload);
  }
}

export function scanWarn(event: string, payload?: unknown): void {
  if (payload === undefined) {
    console.warn(TAG, event);
  } else {
    console.warn(TAG, event, payload);
  }
}

export function scanError(event: string, payload?: unknown): void {
  if (payload === undefined) {
    console.error(TAG, event);
  } else {
    console.error(TAG, event, payload);
  }
}

export function maskKey(apiKey: string | null | undefined): string {
  if (!apiKey) return "<null>";
  if (apiKey.length <= 16) return apiKey;
  return `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`;
}
