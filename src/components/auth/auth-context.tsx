"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAuthClient } from "@/lib/auth/get-auth-client";
import type { AuthUser } from "@/lib/auth/types";

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the first getCurrentUser() check resolves, so the header doesn't flash "signed out" then back in. */
  loading: boolean;
  signUp: (email: string, password: string, ageConfirmed: boolean, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => getAuthClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, [client]);

  const signUp = useCallback(
    async (email: string, password: string, ageConfirmed: boolean, displayName?: string) => {
      setUser(await client.signUp(email, password, ageConfirmed, displayName));
    },
    [client],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setUser(await client.signIn(email, password));
    },
    [client],
  );

  const signOut = useCallback(async () => {
    await client.signOut();
    setUser(null);
  }, [client]);

  const value = useMemo(() => ({ user, loading, signUp, signIn, signOut }), [user, loading, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
