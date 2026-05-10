import { create } from "zustand";

interface ApiKeysUiState {
  generateOpen: boolean;
  lastGeneratedKey: string | null;
  openGenerate: () => void;
  closeGenerate: () => void;
  setLastKey: (key: string | null) => void;
  reset: () => void;
}

export const useApiKeysUi = create<ApiKeysUiState>((set) => ({
  generateOpen: false,
  lastGeneratedKey: null,
  openGenerate: () => set({ generateOpen: true }),
  closeGenerate: () => set({ generateOpen: false }),
  setLastKey: (key) => set({ lastGeneratedKey: key }),
  reset: () => set({ generateOpen: false, lastGeneratedKey: null }),
}));
