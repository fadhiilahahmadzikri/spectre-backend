import { create } from "zustand";

interface AppsUiState {
  createOpen: boolean;
  editingId: string | null;
  openCreate: () => void;
  closeCreate: () => void;
  setEditing: (id: string | null) => void;
  reset: () => void;
}

export const useAppsUi = create<AppsUiState>((set) => ({
  createOpen: false,
  editingId: null,
  openCreate: () => set({ createOpen: true }),
  closeCreate: () => set({ createOpen: false }),
  setEditing: (id) => set({ editingId: id }),
  reset: () => set({ createOpen: false, editingId: null }),
}));
