import { create } from "zustand";

interface AppsUiState {
  createOpen: boolean;
  /**
   * Monotonically incremented every time the Create dialog is opened. Used as
   * a `key` on <CreateApplicationDialog> so React fully remounts the dialog
   * on each open — eliminating any carried-over form state (AP-05 Dialog
   * State Not Cleared).
   */
  createOpenCount: number;
  editingId: string | null;
  openCreate: () => void;
  closeCreate: () => void;
  setEditing: (id: string | null) => void;
  reset: () => void;
}

export const useAppsUi = create<AppsUiState>((set) => ({
  createOpen: false,
  createOpenCount: 0,
  editingId: null,
  openCreate: () =>
    set((s) => ({ createOpen: true, createOpenCount: s.createOpenCount + 1 })),
  closeCreate: () => set({ createOpen: false }),
  setEditing: (id) => set({ editingId: id }),
  reset: () =>
    set({ createOpen: false, editingId: null }),
}));
