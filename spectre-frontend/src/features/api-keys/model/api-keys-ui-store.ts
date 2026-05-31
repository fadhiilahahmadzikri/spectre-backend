import { create } from "zustand";

interface ApiKeysUiState {
  generateOpen: boolean;
  /**
   * Monotonically incremented every time the Generate dialog is opened. Used
   * as a `key` on <GenerateKeyDialog> so React fully remounts the dialog on
   * each open (AP-05).
   */
  generateOpenCount: number;
  lastGeneratedKey: string | null;
  openGenerate: () => void;
  closeGenerate: () => void;
  setLastKey: (key: string | null) => void;
  reset: () => void;
}

export const useApiKeysUi = create<ApiKeysUiState>((set) => ({
  generateOpen: false,
  generateOpenCount: 0,
  lastGeneratedKey: null,
  openGenerate: () =>
    set((s) => ({
      generateOpen: true,
      generateOpenCount: s.generateOpenCount + 1,
    })),
  closeGenerate: () => set({ generateOpen: false }),
  setLastKey: (key) => set({ lastGeneratedKey: key }),
  reset: () => set({ generateOpen: false, lastGeneratedKey: null }),
}));
