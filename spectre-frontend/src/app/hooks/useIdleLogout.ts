import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";

const IDLE_MS = 10 * 60 * 1000;

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

export function useIdleLogout() {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    function reset() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
      }, IDLE_MS);
    }

    reset();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, reset, { passive: true })
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [isLoggedIn, logout]);
}
