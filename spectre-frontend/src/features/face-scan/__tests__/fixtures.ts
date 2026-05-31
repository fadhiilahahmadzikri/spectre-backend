import type { Landmark } from "../model/types";

export interface FaceOverrides {
  center?: { x: number; y: number };
  faceW?: number;
  faceH?: number;
  noseOffset?: { x: number; y: number };
  earOpenness?: number;
}

function computeEyeLandmarks(cx: number, cy: number, openness: number): Record<number, Landmark> {
  const verticalHalf = 0.012 * openness;
  const horizontalHalf = 0.018;
  return {
    0: { x: cx - horizontalHalf, y: cy },
    1: { x: cx - horizontalHalf * 0.4, y: cy - verticalHalf },
    2: { x: cx + horizontalHalf * 0.4, y: cy - verticalHalf },
    3: { x: cx + horizontalHalf, y: cy },
    4: { x: cx + horizontalHalf * 0.4, y: cy + verticalHalf },
    5: { x: cx - horizontalHalf * 0.4, y: cy + verticalHalf },
  };
}

export function buildLandmarks(overrides: FaceOverrides = {}): Landmark[] {
  const center = overrides.center ?? { x: 0.5, y: 0.5 };
  const faceW = overrides.faceW ?? 0.22;
  const faceH = overrides.faceH ?? 0.32;
  const noseOffset = overrides.noseOffset ?? { x: 0, y: 0 };
  const openness = overrides.earOpenness ?? 1;

  const landmarks: Landmark[] = Array.from({ length: 468 }, () => ({
    x: center.x,
    y: center.y,
  }));

  landmarks[234] = { x: center.x - faceW / 2, y: center.y };
  landmarks[454] = { x: center.x + faceW / 2, y: center.y };
  landmarks[10] = { x: center.x, y: center.y - faceH / 2 };
  landmarks[152] = { x: center.x, y: center.y + faceH / 2 };
  landmarks[1] = { x: center.x + noseOffset.x, y: center.y + noseOffset.y };

  const leftEye = computeEyeLandmarks(center.x - faceW * 0.2, center.y - faceH * 0.1, openness);
  const leftKeys = [33, 160, 158, 133, 153, 144];
  const rightEye = computeEyeLandmarks(center.x + faceW * 0.2, center.y - faceH * 0.1, openness);
  const rightKeys = [362, 385, 387, 263, 373, 380];

  leftKeys.forEach((key, i) => {
    landmarks[key] = leftEye[i];
  });
  rightKeys.forEach((key, i) => {
    landmarks[key] = rightEye[i];
  });

  return landmarks;
}

export interface IqaInputOverrides {
  luminance?: number;
  blur?: number;
  blurDelta?: number;
  ignorePose?: boolean;
  face?: FaceOverrides;
  landmarks?: Landmark[] | null;
}

export function buildIqaInput(overrides: IqaInputOverrides = {}) {
  return {
    landmarks:
      overrides.landmarks === undefined
        ? buildLandmarks(overrides.face)
        : overrides.landmarks,
    luminance: overrides.luminance ?? 120,
    blur: overrides.blur ?? 80,
    blurDelta: overrides.blurDelta ?? 0,
    ignorePose: overrides.ignorePose ?? false,
  };
}
