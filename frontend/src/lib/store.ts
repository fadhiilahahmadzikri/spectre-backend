import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (data: { access_token: string; refresh_token: string; user: AuthUser }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (data) =>
        set({ accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "spectre-auth" }
  )
);

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warn";
}

interface OrchestrationState {
  isSyncing: boolean;
  isFrozen: boolean;
  freezeReason: string | null;
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry["type"]) => void;
  clearLogs: () => void;
  setSyncing: (val: boolean) => void;
  setFrozen: (frozen: boolean, reason?: string) => void;
}

export const useOrchestrationStore = create<OrchestrationState>((set) => ({
  isSyncing: false,
  isFrozen: false,
  freezeReason: null,
  logs: [
    {
      id: "init",
      timestamp: new Date().toISOString(),
      message: "Orchestration system initialized. Ready for commands.",
      type: "info",
    },
  ],
  addLog: (message, type = "info") =>
    set((state) => ({
      logs: [
        {
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          message,
          type,
        },
        ...state.logs,
      ].slice(0, 50),
    })),
  clearLogs: () => set({ logs: [] }),
  setSyncing: (val) => set({ isSyncing: val }),
  setFrozen: (frozen, reason = "Synchronizing Environment") => 
    set({ isFrozen: frozen, freezeReason: frozen ? reason : null }),
}));
