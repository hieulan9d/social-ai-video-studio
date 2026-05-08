import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { QuickImageStudio } from "@/components/quick-create/quick-image-studio";
import { QuickVideoStudio } from "@/components/quick-create/quick-video-studio";
import { AssetManager } from "@/components/projects/asset-manager";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { PromptEditor } from "@/components/projects/prompt-editor";
import { RenderPanel } from "@/components/projects/render-panel";
import { SceneTimelineEditor } from "@/components/projects/scene-timeline-editor";
import { ScriptEditor } from "@/components/projects/script-editor";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjectDetail } from "@/lib/projects/server";
import {
  isProjectTab,
  type ProjectAssetRecord,
  type ProjectTab,
} from "@/lib/projects/types";

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

  const activeTab: ProjectTab = tab && isProjectTab(tab) ? tab : "overview";
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
          {activeTab === "overview" ? (
            <div className="space-y-8">
              <SectionBlock
                title="Brief"
                description={
                  project.brief ||
                  "Chưa có brief cho dự án này. Hãy bổ sung góc sản phẩm, khách hàng mục tiêu và thông điệp chính."
                }
              />
              <ScriptEditor project={project} script={detail.script} />
              <SceneTimelineEditor
                project={project}
                script={detail.script}
                scenes={detail.scenes}
              />
            </div>
          ) : null}

          {activeTab === "images" ? (
            <div className="space-y-6">
              <QuickImageStudio projects={[project]} projectId={project.id} />
              <GeneratedProjectAssets
                title="Ảnh đã tạo trong dự án"
                assets={detail.assets.filter((asset) => asset.asset_type === "generated_image")}
              />
            </div>
          ) : null}

          {activeTab === "videos" ? (
            <div className="space-y-6">
              <QuickVideoStudio projects={[project]} projectId={project.id} />
              <RenderPanel
                project={project}
                scenes={detail.scenes}
                prompts={detail.prompts}
                assets={detail.assets}
                renderJobs={detail.renderJobs}
                generatedVideos={detail.generatedVideos}
              />
              <GeneratedProjectAssets
                title="Video đã tạo trong dự án"
                assets={detail.assets.filter((asset) => asset.asset_type === "generated_video")}
              />
            </div>
          ) : null}

          {activeTab === "assets" ? (
            <AssetManager projectId={project.id} initialAssets={detail.assets} />
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
              value={new Date(project.updatedAt).toLocaleString("vi-VN")}
            />
          </div>

          <div className="mt-6 space-y-3">
            {[
              `Số kịch bản: ${detail.script ? 1 : 0}`,
              `Số cảnh: ${detail.scenes.length}`,
              `Số prompt: ${detail.prompts.length}`,
              `Số tài sản: ${detail.assets.length}`,
              `Ảnh tạo bằng AI: ${
                detail.assets.filter((asset) => asset.asset_type === "generated_image").length
              }`,
              `Video tạo bằng AI: ${
                detail.assets.filter((asset) => asset.asset_type === "generated_video").length
              }`,
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
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
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

function GeneratedProjectAssets({
  title,
  assets,
}: {
  title: string;
  assets: ProjectAssetRecord[];
}) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {assets.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-6 text-sm text-[var(--muted-foreground)]">
          Chưa có output nào trong nhóm này.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {assets.map((asset) => (
            <article key={asset.id} className="rounded-2xl border border-[var(--border)] p-3">
              {asset.asset_type === "generated_image" ? (
                <Image
                  src={asset.file_url ?? asset.output_url ?? ""}
                  alt={asset.prompt ?? asset.file_name}
                  width={768}
                  height={768}
                  unoptimized
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : (
                <video
                  src={asset.file_url ?? asset.output_url ?? ""}
                  controls
                  className="aspect-video w-full rounded-xl bg-black"
                />
              )}
              <p className="mt-3 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                {asset.prompt}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
