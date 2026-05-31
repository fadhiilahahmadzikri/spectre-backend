import type { Landmark } from "../model/types";

export function computeEAR(landmarks: readonly Landmark[], idx: readonly number[]): number {
  if (idx.length !== 6) {
    throw new Error("computeEAR requires exactly 6 landmark indices");
  }
  const p = idx.map((i) => landmarks[i]);
  const vertical1 = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y);
  const vertical2 = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y);
  const horizontal = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y);
  return (vertical1 + vertical2) / (2.0 * horizontal + 1e-6);
}

export const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const;
export const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const;
