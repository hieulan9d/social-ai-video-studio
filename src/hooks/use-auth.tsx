"use client";

import { createContext, useContext } from "react";
import type { AuthUserProfile } from "@/lib/auth/types";

const AuthContext = createContext<AuthUserProfile | null>(null);

export function AuthProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: AuthUserProfile;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}
