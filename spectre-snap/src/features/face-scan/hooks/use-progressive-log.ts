import { useCallback, useEffect, useRef, useState } from "react";
import type { LogEntry } from "../model/types";

const OK_FADE_MS = 2400;
const OK_REMOVE_MS = 4000;

interface LogTimeouts {
  fade: ReturnType<typeof setTimeout> | null;
  remove: ReturnType<typeof setTimeout> | null;
}

export function useProgressiveLog() {
  const [currentLog, setCurrentLog] = useState<LogEntry | null>(null);
  const idRef = useRef(0);
  const timeoutsRef = useRef<LogTimeouts>({ fade: null, remove: null });

  const clearTimeouts = useCallback(() => {
    const { fade, remove } = timeoutsRef.current;
    if (fade) clearTimeout(fade);
    if (remove) clearTimeout(remove);
    timeoutsRef.current = { fade: null, remove: null };
  }, []);

  const showLog = useCallback(
    (text: string, kind: LogEntry["kind"] = "info") => {
      const id = ++idRef.current;
      setCurrentLog({ id, text, kind, fading: false });
      clearTimeouts();

      if (kind === "ok" || kind === "info") {
        timeoutsRef.current.fade = setTimeout(() => {
          setCurrentLog((prev) => (prev?.id === id ? { ...prev, fading: true } : prev));
        }, OK_FADE_MS);
        timeoutsRef.current.remove = setTimeout(() => {
          setCurrentLog((prev) => (prev?.id === id ? null : prev));
        }, OK_REMOVE_MS);
      }
    },
    [clearTimeouts],
  );

  const clearLog = useCallback(() => {
    clearTimeouts();
    setCurrentLog(null);
  }, [clearTimeouts]);

  useEffect(() => () => clearTimeouts(), [clearTimeouts]);

  return { currentLog, showLog, clearLog };
}
