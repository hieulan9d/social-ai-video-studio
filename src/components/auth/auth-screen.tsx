import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Film, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUserProfile } from "@/lib/auth/server";

export async function AuthScreen({
  next,
  mode = "login",
  error,
}: {
  next?: string;
  mode?: "login" | "register";
  error?: string;
}) {
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect(next || "/dashboard");
  }

  const errorMessage =
    error === "google_login_failed" ? "Đăng nhập Google thất bại" : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_460px]">
        <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)] lg:p-10">
          <span className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            Cổng đăng nhập
          </span>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Truy cập workspace và quản lý quy trình sản xuất video ngắn.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            Đăng nhập hoặc đăng ký để quản lý dự án, ví credit, tài sản thương
            hiệu và các tác vụ render trong một workspace bảo mật.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Film, title: "Truy cập dự án" },
              { icon: ShieldCheck, title: "Đăng nhập an toàn" },
              { icon: CheckCircle2, title: "Tài khoản gắn với credit" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
              >
                <item.icon className="h-5 w-5 text-[var(--accent)]" />
                <p className="mt-3 text-sm font-medium">{item.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <AuthForm next={next} initialMode={mode} errorMessage={errorMessage} />
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
            Nếu đăng nhập Google thất bại, hãy kiểm tra Google Provider trong
            Supabase và Redirect URL trong Google Cloud OAuth Client.
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-[var(--accent)]"
          >
            Quay lại trang giới thiệu
          </Link>
        </section>
      </div>
    </main>
  );
}
