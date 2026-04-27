import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/types/auth";
import type { Role } from "@/types/common";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

function syncAuthCookie(token: string | null, role: Role | null) {
  if (typeof document === "undefined") return;
  if (token && role) {
    const maxAge = 60 * 60 * 24; // 1 day
    document.cookie = `zentra_token=${token};path=/;max-age=${maxAge};samesite=lax`;
    document.cookie = `zentra_role=${role};path=/;max-age=${maxAge};samesite=lax`;
  } else {
    document.cookie = "zentra_token=;path=/;max-age=0";
    document.cookie = "zentra_role=;path=/;max-age=0";
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        syncAuthCookie(token, user.role);
        set({ user, accessToken: token, isAuthenticated: true });
      },

      logout: () => {
        syncAuthCookie(null, null);
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    { name: "zentra-auth" },
  ),
);
