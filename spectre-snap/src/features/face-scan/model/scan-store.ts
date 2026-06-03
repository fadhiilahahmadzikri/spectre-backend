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

function modeCacheId(apiKey: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < apiKey.length; i++) {
    hash ^= apiKey.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `snap:${(hash >>> 0).toString(36)}`;
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
          modeCache: { ...s.modeCache, [modeCacheId(apiKey)]: mode },
        })),
      setResolvedMode: (mode) =>
        set((s) => ({
          resolvedMode: mode,
          modeCache: s.apiKey
            ? { ...s.modeCache, [modeCacheId(s.apiKey)]: mode }
            : s.modeCache,
        })),
      clear: () =>
        set({ apiKey: null, externalUserId: null, resolvedMode: null }),
      getCachedMode: (apiKey) => get().modeCache[modeCacheId(apiKey)] ?? null,
      setCachedMode: (apiKey, mode) =>
        set((s) => ({ modeCache: { ...s.modeCache, [modeCacheId(apiKey)]: mode } })),
    }),
    {
      name: "spectre-scan-session",
      // Only modeCache survives reloads. apiKey / externalUserId / resolvedMode
      // are per-session — every fresh session goes through IdentityGate, which
      // is the single place identity is resolved.
      partialize: (s) => ({ modeCache: s.modeCache }),
      version: 1,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        return { ...(persisted as object), modeCache: {} };
      },
    },
  ),
);
