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
        eyebrow="Quản lý dự án"
        title="Dự án"
        description="Xem các dự án video, mở workspace chi tiết và theo dõi trạng thái sẵn sàng của pipeline."
        action={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            <Plus className="h-4 w-4" />
            Dự án mới
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
                <MetricCard label="Thời lượng" value={`${project.duration}s`} />
                <MetricCard
                  label="Ngôn ngữ"
                  value={project.language}
                />
                <MetricCard
                  label="Cập nhật"
                  value={new Date(project.updatedAt).toLocaleDateString()}
                />
              </div>

              <p className="mt-6 line-clamp-3 text-sm leading-7 text-[var(--muted-foreground)]">
                {project.brief || "Chưa có brief cho dự án."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
                >
                  Mở dự án
                </Link>
                <ProjectDeleteButton projectId={project.id} />
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <SurfaceCard>
          <h2 className="text-xl font-semibold">Chưa có dự án</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Tạo dự án đầu tiên để lưu brief, chuẩn bị cấu trúc kịch bản, sắp xếp
            cảnh và quản lý các job render trong cùng một workspace.
          </p>
          <Link
            href="/projects/new"
            className="mt-6 inline-flex rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            Tạo dự án đầu tiên
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
