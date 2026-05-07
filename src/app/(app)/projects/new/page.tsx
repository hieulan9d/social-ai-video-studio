import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function CreateProjectPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project intake"
        title="Create Project"
        description="Capture the project brief and core video settings before script generation, prompt building, render orchestration, and export."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <ProjectCreateForm />
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">This project structure includes</h2>
          <div className="mt-6 space-y-3">
            {[
              "A private project owned by the signed-in user",
              "Child tables for scripts, scenes, prompts, assets, renders, and exports",
              "A clean detail workspace with tabbed sections",
              "Ready hooks for future AI generation and video pipeline jobs",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
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
