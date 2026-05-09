"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { createClientSupabase } from "@/lib/supabase/client";

export function GoogleLoginButton({
  next = "/dashboard",
  label = "Đăng nhập bằng Google",
}: {
  next?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClientSupabase();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", next);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (error) {
        throw error;
      }
    } catch {
      setErrorMessage("Không thể đăng nhập bằng Google");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={loading}
        onClick={signInWithGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium disabled:opacity-60"
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Đang chuyển tới Google..." : label}
      </button>
      {errorMessage ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
