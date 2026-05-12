import { useEffect, useRef, useState } from "react";

const IDLE_OPACITY = 0.85;
const GLITCH_MIN_INTERVAL_MS = 1200;
const GLITCH_RANDOM_INTERVAL_MS = 2800;
const GLITCH_MIN_DURATION_MS = 50;
const GLITCH_RANDOM_DURATION_MS = 160;

const GLITCH_LOW_BASE = 0.05;
const GLITCH_LOW_RANGE = 0.2;
const GLITCH_HIGH_BASE = 0.78;
const GLITCH_HIGH_RANGE = 0.18;

export function useGlitchOpacity(active: boolean): number {
  const [opacity, setOpacity] = useState(IDLE_OPACITY);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    let lastEventTime = 0;
    let eventEndTime = 0;
    let inGlitch = false;

    const tick = (timestamp: number) => {
      if (
        !inGlitch &&
        timestamp - lastEventTime >
          GLITCH_MIN_INTERVAL_MS + Math.random() * GLITCH_RANDOM_INTERVAL_MS
      ) {
        inGlitch = true;
        lastEventTime = timestamp;
        eventEndTime =
          timestamp + GLITCH_MIN_DURATION_MS + Math.random() * GLITCH_RANDOM_DURATION_MS;
        setOpacity(GLITCH_LOW_BASE + Math.random() * GLITCH_LOW_RANGE);
      } else if (inGlitch && timestamp >= eventEndTime) {
        inGlitch = false;
        setOpacity(GLITCH_HIGH_BASE + Math.random() * GLITCH_HIGH_RANGE);
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [active]);

  return active ? opacity : IDLE_OPACITY;
}
