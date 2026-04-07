import { User } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 800));
        const user: User = {
          id: "user-1",
          name: email.split("@")[0],
          email,
        };
        set({ user, isAuthenticated: true });
        return true;
      },
      signup: async (name: string, email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 800));
        const user: User = { id: "user-" + Date.now(), name, email };
        set({ user, isAuthenticated: true });
        return true;
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    { name: "foodhub-auth" },
  ),
);
