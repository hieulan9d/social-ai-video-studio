"use client";

import { useCallback, useState } from "react";
import { useAppDataStore } from "@/stores/app-data-store";

export function useCredits() {
  const credits = useAppDataStore((state) => state.shell.credits);
  const setCredits = useAppDataStore((state) => state.setCredits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCredits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/credits", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Không tải được credit.");
      }

      setCredits(Number(payload.credits.balance ?? 0));
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Không tải được credit.",
      );
    } finally {
      setLoading(false);
    }
  }, [setCredits]);

  return {
    balance: credits,
    loading,
    error,
    refreshCredits,
    setBalanceAfterGeneration: setCredits,
  };
}
