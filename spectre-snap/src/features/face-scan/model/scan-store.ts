import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScanMode } from "./types";

interface ResolveParams {
  apiKey: string;
  externalUserId: string;
  mode: ScanMode;
}

interface ScanSession {
  apiKey: string | null;
  externalUserId: string | null;
  resolvedMode: ScanMode | null;
  modeCache: Record<string, ScanMode>;
  resolveSession: (params: ResolveParams) => void;
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
      resolveSession: ({ apiKey, externalUserId, mode }) =>
        set((s) => ({
          apiKey,
          externalUserId,
          resolvedMode: mode,
          modeCache: { ...s.modeCache, [apiKey]: mode },
        })),
      setResolvedMode: (mode) =>
        set((s) => ({
          resolvedMode: mode,
          modeCache: s.apiKey
            ? { ...s.modeCache, [s.apiKey]: mode }
            : s.modeCache,
        })),
      clear: () =>
        set({ apiKey: null, externalUserId: null, resolvedMode: null }),
      getCachedMode: (apiKey) => get().modeCache[apiKey] ?? null,
      setCachedMode: (apiKey, mode) =>
        set((s) => ({ modeCache: { ...s.modeCache, [apiKey]: mode } })),
    }),
    {
      name: "spectre-scan-session",
      // Only modeCache survives reloads. apiKey / externalUserId / resolvedMode
      // are per-session — every fresh session goes through IdentityGate, which
      // is the single place identity is resolved.
      partialize: (s) => ({ modeCache: s.modeCache }),
    },
  ),
);
