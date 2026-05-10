import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScanMode } from "./types";

interface ScanSession {
  apiKey: string | null;
  externalUserId: string | null;
  resolvedMode: ScanMode | null;
  // Persisted: apiKey → mode (survives page reload)
  modeCache: Record<string, ScanMode>;
  setSession: (apiKey: string, externalUserId: string) => void;
  setResolvedMode: (mode: ScanMode) => void;
  clear: () => void;
  getCachedMode: (apiKey: string) => ScanMode | null;
  setCachedMode: (apiKey: string, mode: ScanMode) => void;
}

export const useScanSession = create<ScanSession>()(
  persist(
    (set, get) => ({
      apiKey: null,
      externalUserId: null,
      resolvedMode: null,
      modeCache: {},
      setSession: (apiKey, externalUserId) => set({ apiKey, externalUserId }),
      setResolvedMode: (mode) => set({ resolvedMode: mode }),
      clear: () => set({ apiKey: null, externalUserId: null, resolvedMode: null }),
      getCachedMode: (apiKey) => get().modeCache[apiKey] ?? null,
      setCachedMode: (apiKey, mode) =>
        set((s) => ({ modeCache: { ...s.modeCache, [apiKey]: mode } })),
    }),
    { name: "spectre-scan-session" }
  )
);
