import { create } from "zustand";

interface ConfigUiState {
  open: boolean;
  /**
   * Monotonic counter used as a `key` on <ConfigDialog> so a fresh instance
   * mounts on every open. Prevents AP-05 Dialog State Not Cleared.
   */
  openCount: number;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useConfigUi = create<ConfigUiState>((set) => ({
  open: false,
  openCount: 0,
  openDialog: () => set((s) => ({ open: true, openCount: s.openCount + 1 })),
  closeDialog: () => set({ open: false }),
}));
