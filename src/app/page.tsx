import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  Coins,
  Film,
  ImageUp,
  Layers3,
  PlaySquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
export const dynamic = "force-dynamic"; // thêm dòng này ở đây


const workflow = [
  "Brief",
  "Script",
  "Scenes",
  "Prompts",
  "Veo render",
  "Export",
];

const capabilities = [
  {
    title: "Structured AI production",
    description:
      "Generate Vietnamese ad scripts, scene breakdowns, and Veo-ready English prompts that stay attached to each project.",
    icon: Sparkles,
  },
  {
    title: "Asset-aware rendering",
    description:
      "Upload product images, logos, avatars, backgrounds, start images, and end images for consistent video generation.",
    icon: ImageUp,
  },
  {
    title: "Credit-backed workflow",
    description:
      "Wallet balance, feature pricing, deductions, refunds, and payments are persisted in the database for auditability.",
    icon: Coins,
  },
  {
    title: "Export-ready output",
    description:
      "Merge clips, add subtitles, music, voiceover, watermark/logo, and export 9:16, 1:1, or 16:9 videos.",
    icon: Film,
  },
];

const trust = [
  "Backend-only provider keys",
  "User-scoped projects and assets",
  "Refund path for failed renders",
  "Admin operations dashboard",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="px-6 py-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-14">
          <header className="flex items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-soft)]">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                <Clapperboard className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">Social AI Video Studio</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] md:flex">
              <a href="#workflow">Workflow</a>
              <a href="#features">Features</a>
              <Link href="/pricing">Pricing</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/auth"
                className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/onboarding"
                className="hidden rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)] sm:inline-flex"
              >
                Start
              </Link>
            </div>
          </header>

          <div className="grid min-h-[calc(100vh-9rem)] gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
                <PlaySquare className="h-4 w-4 text-[var(--accent)]" />
                Short-form AI video production for launch teams
              </div>

              <div>
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                  Social AI Video Studio
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                  Turn product briefs into scripts, scene plans, Veo prompts, render
                  jobs, and downloadable social videos inside one credit-based
                  production workspace.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-6 py-4 text-sm font-medium text-[var(--background)]"
                >
                  Launch first project
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm font-medium"
                >
                  View pricing
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {trust.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
                <Image
                  src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80"
                  alt="Social video production workspace"
                  width={1200}
                  height={700}
                  priority
                  className="h-72 w-full object-cover sm:h-96"
                />
                <div className="grid gap-4 p-5 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Active campaign
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">Glow Serum Launch</h2>
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      Credits and assets verified
                    </div>
                  </div>

                  <div className="space-y-3">
                    {workflow.slice(0, 4).map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-[var(--border)] bg-[var(--surface)] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Production workflow
              </p>
              <h2 className="mt-3 text-3xl font-semibold">From idea to final export</h2>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
            >
              Create project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-6">
            {workflow.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
              >
                <p className="text-xs text-[var(--muted-foreground)]">0{index + 1}</p>
                <p className="mt-2 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--accent)]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] px-6 py-8 text-sm text-[var(--muted-foreground)] lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4" />
            Social AI Video Studio
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund-policy">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
