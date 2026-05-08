"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, FolderKanban, Plus, Sparkles } from "lucide-react";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useAppDataStore } from "@/stores/app-data-store";

export function ProjectsPageClient() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim() ?? "";
  const projectsState = useAppDataStore((state) => state.projects);
  const startLoading = useAppDataStore((state) => state.startLoading);
  const setProjects = useAppDataStore((state) => state.setProjects);
  const setError = useAppDataStore((state) => state.setError);

  useEffect(() => {
    if (projectsState.loaded || projectsState.loading) {
      return;
    }

    startLoading("projects");

    void fetch("/api/projects")
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Khong the tai du an.");
        }

        setProjects(payload.projects);
      })
      .catch((error) => {
        setError("projects", error instanceof Error ? error.message : "Khong the tai du an.");
      });
  }, [projectsState.loaded, projectsState.loading, setError, setProjects, startLoading]);

  const filteredProjects = search
    ? projectsState.data.filter((project) =>
        [
          project.title,
          project.brief ?? "",
          project.platform,
          project.videoType,
          project.language,
          project.style ?? "",
        ].some((value) => value.toLowerCase().includes(search.toLowerCase())),
      )
    : projectsState.data;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Project studio"
        title="Du an"
        description="Tap trung brief, script, prompt, image, render job va export trong tung workspace rieng."
        action={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
          >
            <Plus className="h-4 w-4" />
            Tao moi
          </Link>
        }
      />

      {search ? (
        <div className="rounded-[12px] border bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Ket qua tim kiem cho{" "}
          <span className="font-medium text-[var(--heading)]">{search}</span>
        </div>
      ) : null}

      {projectsState.error ? (
        <SurfaceCard className="rounded-[var(--radius-shell)] p-8">
          <p className="text-sm text-[var(--danger)]">{projectsState.error}</p>
        </SurfaceCard>
      ) : null}

      {!projectsState.loaded && projectsState.loading ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SurfaceCard key={index} className="h-full animate-pulse">
              <div className="h-5 w-24 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-4 h-7 w-48 rounded-[10px] bg-[var(--surface-muted)]" />
              <div className="mt-4 h-14 rounded-[12px] bg-[var(--surface-muted)]" />
            </SurfaceCard>
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <SurfaceCard key={project.id} className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                      {project.platform}
                    </span>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-lg font-medium text-[var(--heading)]"
                  >
                    {project.title}
                  </Link>
                  <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">
                    {project.brief || "Chua co brief cho du an nay."}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--highlight)]">
                  <FolderKanban className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Loai" value={project.videoType.replaceAll("_", " ")} />
                <MetricCard label="Thoi luong" value={`${project.duration}s`} />
                <MetricCard label="Ngon ngu" value={project.language} />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    Cap nhat
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {new Date(project.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <Sparkles className="h-4 w-4 text-[var(--highlight)]" />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
                >
                  Mo workspace
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <ProjectDeleteButton projectId={project.id} />
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <SurfaceCard className="rounded-[var(--radius-shell)] p-8">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl font-medium text-[var(--heading)]">
              {search ? "Khong tim thay du an phu hop" : "Chua co du an nao"}
            </h2>
            <p className="text-sm leading-7 text-[var(--muted-foreground)]">
              {search
                ? "Thu tu khoa khac hoac quay lai danh sach day du de tiep tuc lam viec."
                : "Tao du an moi de gom brief, script, prompt, image, video va lich su render vao cung mot workspace."}
            </p>
            <Link
              href={search ? "/projects" : "/projects/new"}
              className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
            >
              {search ? "Xem toan bo du an" : "Tao du an dau tien"}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </SurfaceCard>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}
