import { create } from "zustand";

interface ScanSession {
  apiKey: string | null;
  externalUserId: string | null;
  setSession: (apiKey: string, externalUserId: string) => void;
  clear: () => void;
}

export const useScanSession = create<ScanSession>((set) => ({
  apiKey: null,
  externalUserId: null,
  setSession: (apiKey, externalUserId) => set({ apiKey, externalUserId }),
  clear: () => set({ apiKey: null, externalUserId: null }),
}));
