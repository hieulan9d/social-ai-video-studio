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
  const setCredits = useAppDataStore((state) => state.setCredits);

  useEffect(() => {
    setShell({
      user,
      credits,
    });

    const controller = new AbortController();

    void fetch("/api/me", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          return;
        }

        const balance = Number(payload.credits?.balance);
        if (Number.isFinite(balance)) {
          setCredits(balance);
        }
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("refreshMe failed:", error);
      });

    return () => controller.abort();
  }, [credits, setCredits, setShell, user]);

  return null;
}
