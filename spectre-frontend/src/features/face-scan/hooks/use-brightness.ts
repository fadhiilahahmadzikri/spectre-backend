import { useEffect, useState, type RefObject } from "react";
import { BRIGHTNESS_INTERVAL_MS } from "../model/constants";

const SAMPLE_SIZE = 24;

interface UseBrightnessOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  intervalMs?: number;
}

export function useBrightness({
  videoRef,
  enabled,
  intervalMs = BRIGHTNESS_INTERVAL_MS,
}: UseBrightnessOptions): number {
  const [luminance, setLuminance] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const sampler = document.createElement("canvas");
    sampler.width = SAMPLE_SIZE;
    sampler.height = SAMPLE_SIZE;
    const ctx = sampler.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;
      try {
        ctx.drawImage(video, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        }
        setLuminance(sum / (SAMPLE_SIZE * SAMPLE_SIZE));
      } catch {
        /* frame draw failures are transient */
      }
    };

    const id = window.setInterval(tick, intervalMs);
    tick();

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, intervalMs, videoRef]);

  return enabled ? luminance : 0;
}
