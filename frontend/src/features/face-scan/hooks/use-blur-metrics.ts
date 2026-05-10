import { useEffect, useRef, useState, type RefObject } from "react";
import { IQA_THRESHOLDS } from "../model/constants";
import type { Landmark } from "../model/types";

const SAMPLE_SIZE = 64;
const DEFAULT_INTERVAL_MS = 60;

interface UseBlurMetricsOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  landmarks: readonly Landmark[] | null;
  enabled: boolean;
  intervalMs?: number;
}

interface BlurMetrics {
  blur: number;
  blurDelta: number;
}

function computeLaplacianVariance(data: Uint8ClampedArray, size: number): number {
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = (y * size + x) * 4;
      const top = ((y - 1) * size + x) * 4;
      const bottom = ((y + 1) * size + x) * 4;
      const left = (y * size + (x - 1)) * 4;
      const right = (y * size + (x + 1)) * 4;

      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const gTop = 0.299 * data[top] + 0.587 * data[top + 1] + 0.114 * data[top + 2];
      const gBottom = 0.299 * data[bottom] + 0.587 * data[bottom + 1] + 0.114 * data[bottom + 2];
      const gLeft = 0.299 * data[left] + 0.587 * data[left + 1] + 0.114 * data[left + 2];
      const gRight = 0.299 * data[right] + 0.587 * data[right + 1] + 0.114 * data[right + 2];

      const laplacian = -4 * gray + gTop + gBottom + gLeft + gRight;
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

export function useBlurMetrics({
  videoRef,
  landmarks,
  enabled,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseBlurMetricsOptions): BlurMetrics {
  const [blur, setBlur] = useState(0);
  const [blurDelta, setBlurDelta] = useState(0);
  const landmarksRef = useRef(landmarks);
  const windowRef = useRef<number[]>([]);

  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  useEffect(() => {
    if (!enabled) {
      windowRef.current = [];
      return;
    }

    const sampler = document.createElement("canvas");
    sampler.width = SAMPLE_SIZE;
    sampler.height = SAMPLE_SIZE;
    const ctx = sampler.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const lms = landmarksRef.current;

      if (!video || video.readyState < 2 || video.videoWidth === 0 || !lms || lms.length === 0) {
        return;
      }

      try {
        const faceLeft = lms[234]?.x ?? 0;
        const faceRight = lms[454]?.x ?? 1;
        const faceTop = lms[10]?.y ?? 0;
        const faceBottom = lms[152]?.y ?? 1;

        const sx = Math.max(0, faceLeft * video.videoWidth);
        const sy = Math.max(0, faceTop * video.videoHeight);
        const sw = Math.min(video.videoWidth - sx, (faceRight - faceLeft) * video.videoWidth);
        const sh = Math.min(video.videoHeight - sy, (faceBottom - faceTop) * video.videoHeight);

        if (sw <= 0 || sh <= 0) return;

        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        const variance = computeLaplacianVariance(data, SAMPLE_SIZE);

        const win = windowRef.current;
        win.push(variance);
        if (win.length > IQA_THRESHOLDS.BLUR_WINDOW_SIZE) win.shift();

        const winMean = win.reduce((a, b) => a + b, 0) / win.length;
        const delta = win.length >= 2 ? Math.max(...win) - Math.min(...win) : 0;

        setBlur(winMean);
        setBlurDelta(delta);
      } catch {
        /* transient draw failures */
      }
    };

    const id = window.setInterval(tick, intervalMs);
    tick();

    return () => {
      cancelled = true;
      window.clearInterval(id);
      windowRef.current = [];
    };
  }, [enabled, intervalMs, videoRef]);

  return enabled ? { blur, blurDelta } : { blur: 0, blurDelta: 0 };
}
