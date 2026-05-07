import Link from "next/link";
import {
  ArrowRight,
  Clapperboard,
  Layers3,
  PlaySquare,
  Sparkles,
  Wand2,
} from "lucide-react";

const features = [
  {
    title: "Script to scenes",
    description:
      "Turn one idea into hooks, scene plans, shot directions, and social-ready structure.",
    icon: Wand2,
  },
  {
    title: "Render pipeline",
    description:
      "Organize prompt generation, render jobs, clip review, and export in one workflow.",
    icon: PlaySquare,
  },
  {
    title: "Multi-project workspace",
    description:
      "Manage client campaigns, product launches, and internal content from a clean dashboard.",
    icon: Layers3,
  },
];

const stats = [
  { label: "Project spaces", value: "Unlimited structure" },
  { label: "Prompt templates", value: "Ready for expansion" },
  { label: "Responsive views", value: "Mobile to desktop" },
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.15),transparent_30%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 backdrop-blur">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)]">
              <Clapperboard className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Social AI Video Studio</span>
              <span className="block text-xs text-[var(--muted-foreground)]">
                MVP foundation
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] md:flex">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#pricing">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-elevated)]"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
            >
              Open App
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              AI social video workspace for creators and agencies
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                Build short-form video projects with a clean SaaS foundation.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                This MVP structure is designed for idea intake, project management,
                rendering orchestration, credits, and account operations before AI
                generation is wired in.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
              >
                Create project
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-medium transition hover:bg-[var(--surface-elevated)]"
              >
                Browse workspace
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]"
                >
                  <p className="text-sm text-[var(--muted-foreground)]">{stat.label}</p>
                  <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)]">Active workflow</p>
                  <h2 className="mt-1 text-2xl font-semibold">Glow Serum Launch</h2>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
                  Drafting
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Idea brief collected",
                  "Scene structure ready",
                  "Prompt board prepared",
                  "Render queue awaiting AI engine",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
                      {index + 1}
                    </span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 pb-16 md:grid-cols-3">
          {features.map((feature) => (
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
        </section>
      </div>
    </main>
  );
}
