"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import {
  loginWithPassword,
  registerWithPassword,
  type AuthActionState,
} from "@/lib/auth/actions";

const initialState: AuthActionState = {
  error: null,
  success: null,
};

export function AuthForm({
  next,
  initialMode = "login",
  errorMessage,
}: {
  next?: string;
  initialMode?: "login" | "register";
  errorMessage?: string | null;
}) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
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
  const title = mode === "login" ? "Đăng nhập" : "Đăng ký";

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
          Đăng nhập
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
          Đăng ký
        </button>
      </div>

      <div className="mt-6">
        <GoogleLoginButton
          next={next || "/dashboard"}
          label={mode === "login" ? "Đăng nhập bằng Google" : "Đăng ký bằng Google"}
        />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        hoặc
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next || "/dashboard"} />

        <div>
          <label className="mb-2 block text-sm font-medium">Địa chỉ email</label>
          <input
            required
            name="email"
            type="email"
            placeholder="you@brand.com"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Mật khẩu</label>
          <input
            required
            minLength={6}
            name="password"
            type="password"
            placeholder="Nhập mật khẩu của bạn"
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        {mode === "register" ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium">Họ và tên</label>
              <input
                required
                name="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Tên workspace</label>
              <input
                name="workspaceName"
                type="text"
                placeholder="Tên thương hiệu hoặc đội nhóm"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
              />
            </div>
          </>
        ) : null}

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {errorMessage}
          </p>
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
    </div>
  );
}
