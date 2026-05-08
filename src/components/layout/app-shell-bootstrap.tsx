"use client";

import { useEffect } from "react";
import type { AuthUserProfile } from "@/lib/auth/types";
import { useAppDataStore } from "@/stores/app-data-store";

export function AppShellBootstrap({
  user,
  credits,
}: {
  user: AuthUserProfile;
  credits: number;
}) {
  const setShell = useAppDataStore((state) => state.setShell);

  useEffect(() => {
    setShell({
      user,
      credits,
    });
  }, [credits, setShell, user]);

  return null;
}
