import { useSyncExternalStore } from "react";

function subscribe(query: string) {
  return (onChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

function getSnapshot(query: string) {
  return () => (typeof window === "undefined" ? false : window.matchMedia(query).matches);
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(subscribe(query), getSnapshot(query), getServerSnapshot);
}

export const MEDIA_MOBILE = "(max-width: 767px)";
export const MEDIA_DESKTOP = "(min-width: 768px)";
