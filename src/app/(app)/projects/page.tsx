import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";

function matchesProjectSearch(project: Awaited<ReturnType<typeof getProjects>>[number], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    project.title,
    project.brief ?? "",
    project.platform,
    project.videoType,
    project.language,
    project.style ?? "",
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const user = await requireUserProfile();
  const { search } = await searchParams;
  const projects = await getProjects(user.id);
  const filteredProjects = search?.trim()
    ? projects.filter((project) => matchesProjectSearch(project, search))
    : projects;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quan ly du an"
        title="Du an"
        description="Xem cac du an video, mo workspace chi tiet va theo doi trang thai san sang cua pipeline."
        action={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            <Plus className="h-4 w-4" />
            Du an moi
          </Link>
        }
      />

      {search?.trim() ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Ket qua tim kiem cho: <span className="font-medium text-[var(--foreground)]">{search}</span>
        </div>
      ) : null}

      {filteredProjects.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredProjects.map((project) => (
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
                <MetricCard label="Thoi luong" value={`${project.duration}s`} />
                <MetricCard label="Ngon ngu" value={project.language} />
                <MetricCard
                  label="Cap nhat"
                  value={new Date(project.updatedAt).toLocaleDateString()}
                />
              </div>

              <p className="mt-6 line-clamp-3 text-sm leading-7 text-[var(--muted-foreground)]">
                {project.brief || "Chua co brief cho du an."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
                >
                  Mo du an
                </Link>
                <ProjectDeleteButton projectId={project.id} />
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <SurfaceCard>
          <h2 className="text-xl font-semibold">
            {search?.trim() ? "Khong tim thay du an phu hop" : "Chua co du an"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {search?.trim()
              ? "Thu tim voi tu khoa khac hoac xoa bo loc hien tai."
              : "Tao du an dau tien de luu brief, chuan bi cau truc kich ban, sap xep canh va quan ly cac job render trong cung mot workspace."}
          </p>
          <Link
            href={search?.trim() ? "/projects" : "/projects/new"}
            className="mt-6 inline-flex rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            {search?.trim() ? "Xem tat ca du an" : "Tao du an dau tien"}
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
