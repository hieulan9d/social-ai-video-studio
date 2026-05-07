import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock3, Coins, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";
import { getUserWallet } from "@/lib/wallet/server";

export default async function DashboardPage() {
  const user = await requireUserProfile();
  const [wallet, projects] = await Promise.all([
    getUserWallet(user.id),
    getProjects(user.id),
  ]);
  const recentProjects = projects.slice(0, 3);
  const stats = [
    {
      title: "Active projects",
      value: projects.length.toString(),
      note: "Private projects owned by this workspace",
      icon: BarChart3,
    },
    {
      title: "Credits remaining",
      value: wallet.balanceCredit.toString(),
      note: "Live wallet balance read directly from the database.",
      icon: Coins,
    },
    {
      title: "Queued renders",
      value: "Live",
      note: "Render and export state is tracked on each project",
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace overview"
        title="Dashboard"
        description="A control center for project intake, credits, render tracking, and launch operations."
      />

      {!user.onboardingCompletedAt ? (
        <SurfaceCard>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--accent)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Finish onboarding</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Set your launch goals, then jump into the first project with the
                  right workflow context.
                </p>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
            >
              Continue setup
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {stats.map((item) => (
          <SurfaceCard key={item.title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">{item.title}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">{item.value}</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.note}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-elevated)] p-3 text-[var(--accent)]">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Recent projects</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Latest project activity in this workspace.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
              Synced layout
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex flex-col justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 md:flex-row md:items-center"
                >
                  <div>
                    <p className="text-base font-medium">{project.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {project.platform} / {project.videoType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                    {project.status.replaceAll("_", " ")}
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                <p className="font-medium">No projects yet</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Create the first project to start script, scene, prompt, render,
                  and export workflows.
                </p>
                <Link
                  href="/projects/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
                >
                  Create project
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--surface-elevated)] p-3 text-[var(--accent)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Build status</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Launch readiness across the production pipeline.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              "Auth, wallet, payments, and admin controls are ready",
              "Asset upload and storage abstraction are wired",
              "Text-to-video, image-to-video, and transition jobs are tracked",
              "Export engine creates downloadable final video records",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
