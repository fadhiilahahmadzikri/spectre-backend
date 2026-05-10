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
