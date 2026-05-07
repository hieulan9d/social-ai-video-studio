import { BarChart3, Clock3, Coins, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { getUserWallet } from "@/lib/wallet/server";

export default async function DashboardPage() {
  const user = await requireUserProfile();
  const wallet = await getUserWallet(user.id);
  const stats = [
    {
      title: "Active projects",
      value: "12",
      note: "Across ecommerce, beauty, and local campaigns",
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
      value: "06",
      note: "Placeholder pipeline cards waiting for AI integration",
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace overview"
        title="Dashboard"
        description="A clean control center for project intake, credits, render tracking, and upcoming AI workflows."
      />

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
                Placeholder cards for the teams and campaigns using this workspace.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
              Synced layout
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                title: "Herbal Care Launch",
                status: "Drafting scenes",
                type: "Healthcare ad",
              },
              {
                title: "Spa Membership Push",
                status: "Prompt board ready",
                type: "Local business",
              },
              {
                title: "Vitamin C Drop",
                status: "Waiting for render engine",
                type: "Beauty campaign",
              },
            ].map((project) => (
              <div
                key={project.title}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 md:flex-row md:items-center"
              >
                <div>
                  <p className="text-base font-medium">{project.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {project.type}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                  {project.status}
                </span>
              </div>
            ))}
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
                AI generation is intentionally deferred in this MVP foundation.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              "App routing and shell are ready",
              "Supabase auth and wallet helpers are configured",
              "Project, wallet, and settings screens are scaffolded",
              "Render queue UI is ready for backend wiring",
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
