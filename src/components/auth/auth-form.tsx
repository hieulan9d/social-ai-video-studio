"use client";

import { useActionState, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import {
  loginWithPassword,
  registerWithPassword,
  type AuthActionState,
} from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/env";

const initialState: AuthActionState = {
  error: null,
  success: null,
};

export function AuthForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isGooglePending, startGoogleTransition] = useTransition();
  const [loginState, loginAction, loginPending] = useActionState(
    loginWithPassword,
    initialState,
  );
  const [registerState, registerAction, registerPending] = useActionState(
    registerWithPassword,
    initialState,
  );

  const state = mode === "login" ? loginState : registerState;
  const formAction = mode === "login" ? loginAction : registerAction;
  const pending = mode === "login" ? loginPending : registerPending;

  const title = mode === "login" ? "Login" : "Register";

  const signInWithGoogle = () => {
    startGoogleTransition(async () => {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", getSiteUrl());
      redirectTo.searchParams.set("next", next || "/dashboard");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (error) {
        console.error(error);
      }
    });
  };

  return (
    <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="grid grid-cols-2 rounded-2xl bg-[var(--surface-elevated)] p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={[
            "rounded-xl px-4 py-3 transition",
            mode === "login"
              ? "bg-[var(--background)] font-medium shadow-sm"
              : "text-[var(--muted-foreground)]",
          ].join(" ")}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={[
            "rounded-xl px-4 py-3 transition",
            mode === "register"
              ? "bg-[var(--background)] font-medium shadow-sm"
              : "text-[var(--muted-foreground)]",
          ].join(" ")}
        >
          Register
        </button>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next || "/dashboard"} />

        <div>
          <label className="mb-2 block text-sm font-medium">Email address</label>
          <input
            required
            name="email"
            type="email"
            placeholder="you@brand.com"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Password</label>
          <input
            required
            minLength={6}
            name="password"
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        {mode === "register" ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">Full name</label>
              <input
                required
                name="fullName"
                type="text"
                placeholder="Nguyen Van A"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Workspace name</label>
              <input
                name="workspaceName"
                type="text"
                placeholder="Your brand or team"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
            </div>
          </>
        ) : null}

        {state.error ? (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {state.error}
          </p>
        ) : null}

        {state.success ? (
          <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {state.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)] disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {title}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        Or continue with
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <button
        type="button"
        disabled={isGooglePending}
        onClick={signInWithGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium disabled:opacity-60"
      >
        {isGooglePending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Continue with Google
      </button>
    </div>
  );
}
