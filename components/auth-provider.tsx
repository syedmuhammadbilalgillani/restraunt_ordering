"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuthSnapshot,
  type AuthSnapshot,
} from "@/lib/iron-session/auth/auth.actions";

type AuthContextValue = {
  snapshot: AuthSnapshot | undefined;
  isLoading: boolean;
  refresh: () => Promise<unknown>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["authSnapshot"],
    queryFn: () => getAuthSnapshot(),
    staleTime: 60_000,
  });

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["authSnapshot"] }),
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      snapshot: q.data,
      isLoading: q.isLoading,
      refresh,
    }),
    [q.data, q.isLoading, refresh],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}