import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";

export default async function ProjectsPage() {
  const user = await requireUserProfile();
  const projects = await getProjects(user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project management"
        title="Projects"
        description="Browse your video projects, open detail workspaces, and manage pipeline readiness by status."
        action={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            <Plus className="h-4 w-4" />
            New project
          </Link>
        }
      />

      {projects.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((project) => (
            <SurfaceCard key={project.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/projects/${project.id}`} className="text-xl font-semibold">
                    {project.title}
                  </Link>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {project.platform} · {project.videoType.replaceAll("_", " ")}
                  </p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <MetricCard label="Duration" value={`${project.duration}s`} />
                <MetricCard
                  label="Language"
                  value={project.language}
                />
                <MetricCard
                  label="Updated"
                  value={new Date(project.updatedAt).toLocaleDateString()}
                />
              </div>

              <p className="mt-6 line-clamp-3 text-sm leading-7 text-[var(--muted-foreground)]">
                {project.brief || "No project brief yet."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
                >
                  Open project
                </Link>
                <ProjectDeleteButton projectId={project.id} />
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <SurfaceCard>
          <h2 className="text-xl font-semibold">No projects yet</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Create your first project to capture the brief, prepare the script
            structure, organize scenes, and manage future render jobs from one
            workspace.
          </p>
          <Link
            href="/projects/new"
            className="mt-6 inline-flex rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            Create first project
          </Link>
        </SurfaceCard>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-elevated)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-base font-medium">{value}</p>
    </div>
  );
}
