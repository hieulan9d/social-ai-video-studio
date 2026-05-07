import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Film, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUserProfile } from "@/lib/auth/server";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect("/dashboard");
  }

  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10 lg:px-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_460px]">
        <section className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-soft)] lg:p-10">
          <span className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            Authentication portal
          </span>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Access your workspace and manage social video operations.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
            This placeholder auth screen is ready to connect with Supabase Auth.
            It includes login, registration, and trust messaging without wiring
            backend logic yet.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Film, title: "Project access" },
              { icon: ShieldCheck, title: "Secure auth flow" },
              { icon: CheckCircle2, title: "Credit-aware accounts" },
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
          <AuthForm next={next} />
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">
            Enable Email provider and Google provider in your Supabase project, then
            add the callback URL shown in `.env.local`.
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-medium text-[var(--accent)]"
          >
            Back to landing page
          </Link>
        </section>
      </div>
    </main>
  );
}
