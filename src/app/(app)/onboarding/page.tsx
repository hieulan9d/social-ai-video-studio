import Link from "next/link";
import { CheckCircle2, FolderPlus, ImageUp, PlaySquare, Sparkles } from "lucide-react";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { completeOnboardingAction } from "@/lib/onboarding/actions";

const checklist = [
  {
    title: "Create your first project",
    description: "Capture platform, duration, style, language, and the campaign brief.",
    icon: FolderPlus,
  },
  {
    title: "Generate script, scenes, and prompts",
    description: "Use credits for structured AI output that stays attached to the project.",
    icon: Sparkles,
  },
  {
    title: "Upload brand assets",
    description: "Add product images, logos, avatars, and start/end images for consistency.",
    icon: ImageUp,
  },
  {
    title: "Render and export",
    description: "Submit Veo jobs, review clips, then export a downloadable final video.",
    icon: PlaySquare,
  },
];

const goals = [
  "TikTok product ads",
  "Beauty and skincare launches",
  "Restaurant promos",
  "Local service campaigns",
  "Agency production pipeline",
  "AI virtual KOL content",
];

export default async function OnboardingPage() {
  const user = await requireUserProfile();
  const isComplete = Boolean(user.onboardingCompletedAt);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Launch setup"
        title="Onboarding"
        description="A short setup path for turning an empty workspace into the first usable video production project."
      />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[var(--surface-elevated)] p-3 text-[var(--accent)]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isComplete ? "Onboarding completed" : "Complete setup"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Save your launch intent so the workspace can guide you toward the
                right first project flow.
              </p>
            </div>
          </div>

          <form action={completeOnboardingAction} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Workspace role</label>
              <select
                name="workspaceRole"
                defaultValue="creator"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none focus:border-[var(--accent)]"
              >
                <option value="creator">Creator</option>
                <option value="brand">Brand operator</option>
                <option value="agency">Agency team</option>
                <option value="editor">Video editor</option>
              </select>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">Primary launch goals</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {goals.map((goal) => (
                  <label
                    key={goal}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="goals"
                      value={goal}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    {goal}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <FormSubmitButton
                pendingLabel="Saving setup..."
                className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
              >
                Save and create project
              </FormSubmitButton>
              <Link
                href="/projects/new"
                className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm font-medium"
              >
                Skip to project
              </Link>
            </div>
          </form>
        </SurfaceCard>

        <div className="grid gap-4">
          {checklist.map((item, index) => (
            <SurfaceCard key={item.title}>
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </div>
  );
}
