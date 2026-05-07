import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetManager } from "@/components/projects/asset-manager";
import { ExportPanel } from "@/components/projects/export-panel";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { PromptEditor } from "@/components/projects/prompt-editor";
import { RenderPanel } from "@/components/projects/render-panel";
import { SceneTimelineEditor } from "@/components/projects/scene-timeline-editor";
import { ScriptEditor } from "@/components/projects/script-editor";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjectDetail } from "@/lib/projects/server";
import { isProjectTab, type ProjectTab } from "@/lib/projects/types";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUserProfile();
  const { projectId } = await params;
  const { tab } = await searchParams;
  const detail = await getProjectDetail(projectId, user.id);

  if (!detail) {
    notFound();
  }

  const activeTab: ProjectTab = tab && isProjectTab(tab) ? tab : "brief";
  const { project } = detail;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            Workspace dự án
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            {project.platform} / {project.videoType.replaceAll("_", " ")} /{" "}
            {project.duration}s / {project.language}
            {project.style ? ` / ${project.style}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProjectStatusBadge status={project.status} />
          <Link
            href="/projects"
            className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted-foreground)]"
          >
            Quay lại dự án
          </Link>
          <ProjectDeleteButton projectId={project.id} />
        </div>
      </div>

      <ProjectTabs projectId={project.id} activeTab={activeTab} />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard>
          {activeTab === "brief" ? (
            <SectionBlock
              title="Brief"
              description={
                project.brief ||
                "Chưa có brief cho dự án này. Hãy bổ sung góc sản phẩm, khách hàng mục tiêu và thông điệp chính."
              }
            />
          ) : null}

          {activeTab === "script" ? (
            <ScriptEditor project={project} script={detail.script} />
          ) : null}

          {activeTab === "scenes" ? (
            <SceneTimelineEditor
              project={project}
              script={detail.script}
              scenes={detail.scenes}
            />
          ) : null}

          {activeTab === "prompts" ? (
            <PromptEditor
              project={project}
              script={detail.script}
              scenes={detail.scenes}
              prompts={detail.prompts}
              assets={detail.assets}
            />
          ) : null}

          {activeTab === "assets" ? (
            <AssetManager projectId={project.id} initialAssets={detail.assets} />
          ) : null}

          {activeTab === "render" ? (
            <RenderPanel
              project={project}
              scenes={detail.scenes}
              prompts={detail.prompts}
              assets={detail.assets}
              renderJobs={detail.renderJobs}
              generatedVideos={detail.generatedVideos}
            />
          ) : null}

          {activeTab === "export" ? (
            <ExportPanel
              projectId={project.id}
              assets={detail.assets}
              generatedVideos={detail.generatedVideos}
              exportJobs={detail.exportJobs}
            />
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Tổng quan dự án</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <OverviewCard label="Nền tảng" value={project.platform} />
            <OverviewCard
              label="Loại video"
              value={project.videoType.replaceAll("_", " ")}
            />
            <OverviewCard label="Thời lượng" value={`${project.duration} giây`} />
            <OverviewCard label="Ngôn ngữ" value={project.language} />
            <OverviewCard label="Phong cách" value={project.style || "Chưa thiết lập"} />
            <OverviewCard
              label="Cập nhật"
              value={new Date(project.updatedAt).toLocaleString()}
            />
          </div>

          <div className="mt-6 space-y-3">
            {[
              `Số kịch bản: ${detail.script ? 1 : 0}`,
              `Số cảnh: ${detail.scenes.length}`,
              `Số prompt: ${detail.prompts.length}`,
              `Số tài sản: ${detail.assets.length}`,
              `Job render: ${detail.renderJobs.length}`,
              `Bản export: ${detail.exportJobs.length}`,
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

function SectionBlock({
  title,
  description,
  metadata,
}: {
  title: string;
  description: string;
  metadata?: Array<string | null>;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
      {metadata?.filter(Boolean).length ? (
        <div className="mt-6 space-y-3">
          {metadata.filter(Boolean).map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
            >
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-base font-medium">{value}</p>
    </div>
  );
}
