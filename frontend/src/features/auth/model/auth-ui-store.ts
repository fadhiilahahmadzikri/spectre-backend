import { create } from "zustand";

export type AuthMode = "signin" | "signup";

interface AuthUiState {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  toggle: () => void;
}

export const useAuthUi = create<AuthUiState>((set) => ({
  mode: "signin",
  setMode: (mode) => set({ mode }),
  toggle: () => set((s) => ({ mode: s.mode === "signin" ? "signup" : "signin" })),
}));
