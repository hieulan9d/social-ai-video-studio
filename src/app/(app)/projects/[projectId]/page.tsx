import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Expand,
  FolderOpen,
  Layers3,
  ScanSearch,
  Sparkles,
  Upload,
} from "lucide-react";
import { listProjectAssets } from "@/lib/assets/server";
import { QuickImageStudio } from "@/components/quick-create/quick-image-studio";
import { QuickVideoStudio } from "@/components/quick-create/quick-video-studio";
import { ProjectAssetsSectionClient } from "@/components/projects/project-assets-section-client";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { PromptEditor } from "@/components/projects/prompt-editor";
import { RenderPanel } from "@/components/projects/render-panel";
import { SceneTimelineEditor } from "@/components/projects/scene-timeline-editor";
import { ScriptEditor } from "@/components/projects/script-editor";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import {
  getProjectById,
  getProjectExportJobs,
  getProjectGeneratedVideos,
  getProjectPrompts,
  getProjectRenderJobs,
  getProjectScenes,
  getProjectScript,
} from "@/lib/projects/server";
import {
  isProjectTab,
  type ExportJobRecord,
  type GeneratedVideoRecord,
  type ProjectAssetRecord,
  type ProjectTab,
  type PromptRecord,
  type RenderJobRecord,
  type SceneRecord,
  type ScriptRecord,
} from "@/lib/projects/types";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  try {
    return await ProjectDetailPageContent({ params, searchParams });
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Project detail page load failed:", error);
    return <ServerDataFallback />;
  }
}

async function ProjectDetailPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUserProfile();
  const { projectId } = await params;
  const { tab } = await searchParams;
  const activeTab: ProjectTab = tab && isProjectTab(tab) ? tab : "overview";
  const project = await getProjectById(projectId, user.id);

  if (!project) {
    notFound();
  }

  let script: ScriptRecord | null = null;
  let scenes: SceneRecord[] = [];
  let prompts: PromptRecord[] = [];
  let assets: ProjectAssetRecord[] = [];
  let renderJobs: RenderJobRecord[] = [];
  let generatedVideos: GeneratedVideoRecord[] = [];
  let exportJobs: ExportJobRecord[] = [];
  let imageCreditCost = 0;
  let videoCreditCost = 0;
  let imageToVideoCreditCost = 0;
  let transitionVideoCreditCost = 0;

  if (activeTab === "overview") {
    const overviewData = (await Promise.all([
      getProjectScript(projectId),
      getProjectScenes(projectId),
    ])) as [ScriptRecord | null, SceneRecord[]];
    [script, scenes] = overviewData;
  }

  if (activeTab === "images") {
    const imagesData = (await Promise.all([
      listProjectAssets(projectId, user.id),
      getFeatureCreditCost("image_generation"),
    ])) as [ProjectAssetRecord[], number];
    [assets, imageCreditCost] = imagesData;
  }

  if (activeTab === "videos") {
    const videosData = (await Promise.all([
        listProjectAssets(projectId, user.id),
        getProjectScenes(projectId),
        getProjectPrompts(projectId),
        getProjectRenderJobs(projectId),
        getProjectGeneratedVideos(projectId),
        getProjectExportJobs(projectId),
        getFeatureCreditCost("veo_render"),
        getFeatureCreditCost("image_to_video"),
        getFeatureCreditCost("transition_video"),
      ])) as [
        ProjectAssetRecord[],
        SceneRecord[],
        PromptRecord[],
        RenderJobRecord[],
        GeneratedVideoRecord[],
        ExportJobRecord[],
        number,
        number,
        number,
      ];
    [assets, scenes, prompts, renderJobs, generatedVideos, exportJobs, videoCreditCost, imageToVideoCreditCost, transitionVideoCreditCost] =
      videosData;
  }

  if (activeTab === "prompts") {
    const promptsData = (await Promise.all([
      listProjectAssets(projectId, user.id),
      getProjectScript(projectId),
      getProjectScenes(projectId),
      getProjectPrompts(projectId),
    ])) as [ProjectAssetRecord[], ScriptRecord | null, SceneRecord[], PromptRecord[]];
    [assets, script, scenes, prompts] = promptsData;
  }

  const previewAsset = resolvePreviewAsset(assets);
  const timeline =
    activeTab === "videos"
      ? buildTimeline(renderJobs, generatedVideos, exportJobs)
      : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
            Project workspace
          </p>
          <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--heading)]">
            {project.title}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {project.platform} · {project.videoType.replaceAll("_", " ")} · {project.duration}s ·{" "}
            {project.language}
            {project.style ? ` · ${project.style}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProjectStatusBadge status={project.status} />
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại dự án
          </Link>
          <ProjectDeleteButton projectId={project.id} />
        </div>
      </div>

      <ProjectTabs projectId={project.id} activeTab={activeTab} />

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <SurfaceCard className="h-fit">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--heading)]">{project.title}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {activeTab === "videos"
                    ? `${renderJobs.length} render jobs đang hiển thị`
                    : activeTab === "assets" || activeTab === "images" || activeTab === "prompts"
                      ? `${assets.length} assets đang hiển thị`
                      : "Mở từng tab để tải dữ liệu theo nhu cầu"}
                </p>
              </div>
              <FolderOpen className="h-4 w-4 text-[var(--highlight)]" />
            </div>

            <Link
              href={`/projects/${project.id}?tab=assets`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
            >
              <Upload className="h-4 w-4" />
              Upload asset
            </Link>

            <div className="grid gap-2">
              <SidebarMetric
                label="Tất cả"
                value={assets.length > 0 ? String(assets.length) : "—"}
              />
              <SidebarMetric
                label="Ảnh"
                value={
                  assets.length > 0
                    ? String(assets.filter((asset) => asset.type === "image").length)
                    : "—"
                }
              />
              <SidebarMetric
                label="Video"
                value={
                  assets.length > 0
                    ? String(assets.filter((asset) => asset.type === "video").length)
                    : "—"
                }
              />
              <SidebarMetric
                label="Prompt"
                value={prompts.length > 0 ? String(prompts.length) : activeTab === "prompts" || activeTab === "videos" ? "0" : "—"}
              />
              <SidebarMetric
                label="Kịch bản"
                value={script ? "1" : activeTab === "overview" || activeTab === "prompts" ? "0" : "—"}
              />
            </div>

            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                Asset gần đây
              </p>
              {assets.length > 0 ? (
                assets.slice(0, 6).map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 rounded-[8px] border bg-[var(--surface-muted)] p-2.5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[8px] border bg-[#101a2f]">
                      {asset.type === "image" && asset.file_url ? (
                        <Image
                          src={asset.file_url}
                          alt={asset.file_name}
                          width={96}
                          height={96}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Layers3 className="h-4 w-4 text-[var(--highlight)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--foreground)]">{asset.file_name}</p>
                      <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                        {new Date(asset.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[8px] border border-dashed px-3 py-5 text-sm text-[var(--muted-foreground)]">
                  Mở tab Ảnh, Video, Prompt hoặc Assets để tải danh sách asset.
                </div>
              )}
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-5">
          <SurfaceCard className="rounded-[var(--radius-shell)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-[var(--heading)]">Preview canvas</h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Chọn asset hoặc tạo nội dung mới để xem trong canvas trung tâm.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Fit", icon: Expand },
                  { label: "Zoom", icon: ScanSearch },
                  { label: "Compare", icon: Layers3 },
                  { label: "Download", icon: Download },
                  { label: "Export", icon: Sparkles },
                ].map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[12px] border bg-[var(--surface-muted)]">
              {previewAsset ? (
                previewAsset.type === "generated_video" ? (
                  <video src={previewAsset.url} controls className="aspect-video w-full bg-black" />
                ) : (
                  <Image
                    src={previewAsset.url}
                    alt={previewAsset.alt}
                    width={1400}
                    height={900}
                    unoptimized
                    className="aspect-video w-full object-cover"
                  />
                )
              ) : (
                <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-[var(--muted-foreground)]">
                  {activeTab === "overview"
                    ? "Trang tổng quan đang tải nhẹ hơn. Mở tab Ảnh, Video hoặc Assets để xem preview thật."
                    : "Chọn asset hoặc tạo nội dung mới"}
                </div>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="space-y-6">
              {activeTab === "overview" ? (
                <>
                  <SectionBlock
                    title="Brief"
                    description={
                      project.brief ||
                      "Chưa có brief cho dự án này. Hãy bổ sung sản phẩm, nhóm khách hàng, thông điệp chính và bối cảnh phân phối."
                    }
                  />
                  <ScriptEditor project={project} script={script} />
                  <SceneTimelineEditor
                    project={project}
                    script={script}
                    scenes={scenes}
                  />
                </>
              ) : null}

              {activeTab === "images" ? (
                <>
                  <QuickImageStudio
                    projects={[project]}
                    projectId={project.id}
                    estimatedCreditCost={imageCreditCost}
                  />
                  <GeneratedProjectAssets
                    title="Ảnh đã tạo trong dự án"
                    assets={assets.filter((asset) => asset.asset_type === "generated_image")}
                  />
                </>
              ) : null}

              {activeTab === "videos" ? (
                <>
                  <QuickVideoStudio
                    projects={[project]}
                    projectId={project.id}
                    estimatedCreditCost={videoCreditCost}
                    imageToVideoCreditCost={imageToVideoCreditCost}
                    transitionVideoCreditCost={transitionVideoCreditCost}
                  />
                  <RenderPanel
                    project={project}
                    scenes={scenes}
                    prompts={prompts}
                    assets={assets}
                    renderJobs={renderJobs}
                    generatedVideos={generatedVideos}
                  />
                  <GeneratedProjectAssets
                    title="Video đã tạo trong dự án"
                    assets={assets.filter((asset) => asset.asset_type === "generated_video")}
                  />
                </>
              ) : null}

              {activeTab === "assets" ? (
                <ProjectAssetsSectionClient projectId={project.id} />
              ) : null}

              {activeTab === "prompts" ? (
                <PromptEditor
                  project={project}
                  script={script}
                  scenes={scenes}
                  prompts={prompts}
                  assets={assets}
                />
              ) : null}
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="h-fit">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Workflow settings</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Chọn workflow phù hợp và chuyển nhanh sang panel tạo nội dung.
              </p>
            </div>

            <div className="grid gap-2">
              {[
                "Text to Image",
                "Image to Video",
                "Start/End Image to Video",
                "Prompt to Script",
                "Script to Video Prompts",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[8px] border bg-[var(--surface-muted)] px-3 py-3 text-sm text-[var(--muted-foreground)]"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <SettingMetric
                label="Prompt"
                value={prompts.length > 0 ? `${prompts.length} prompt` : "Tải khi mở tab Prompt/Video"}
              />
              <SettingMetric label="Model provider" value="OpenAI · Google · 9Router" />
              <SettingMetric label="Tỷ lệ / thời lượng" value={`${project.duration}s · social format`} />
              <SettingMetric label="Seed / chất lượng" value="Auto · tiêu chuẩn" />
              <SettingMetric label="Ước tính credits" value="Chỉ ảnh và video mới trừ credits" />
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/projects/${project.id}?tab=images`}
                className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
              >
                Tạo ảnh
              </Link>
              <Link
                href={`/projects/${project.id}?tab=videos`}
                className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]"
              >
                Tạo video
              </Link>
              <Link
                href={`/projects/${project.id}?tab=prompts`}
                className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]"
              >
                Tạo prompt
              </Link>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {activeTab === "videos" ? (
        <SurfaceCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Lịch sử / timeline</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Theo dõi các generation, render và export gần đây của dự án.
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="flex min-w-max gap-4">
              {timeline.length > 0 ? (
                timeline.map((item) => (
                  <div
                    key={item.id}
                    className="w-64 shrink-0 rounded-[12px] border bg-[var(--surface-muted)] p-4"
                  >
                    <div className="flex h-24 items-center justify-center rounded-[8px] border bg-[#101a2f] text-[var(--highlight)]">
                      <Layers3 className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-[var(--heading)]">{item.label}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.model}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                      <span className={getTimelineStatusClass(item.status)}>
                        {formatTimelineStatus(item.status)}
                      </span>
                      <span className="text-[var(--muted)]">{item.time}</span>
                    </div>
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                      {item.creditLabel}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] border border-dashed px-4 py-8 text-sm text-[var(--muted-foreground)]">
                  Chưa có bản ghi timeline nào.
                </div>
              )}
            </div>
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}

function SidebarMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[8px] border bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
      <span>{label}</span>
      <span className="text-[var(--foreground)]">{value}</span>
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
      <h2 className="text-xl font-medium text-[var(--heading)]">{title}</h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-foreground)]">
        {description}
      </p>
    </div>
  );
}

function SettingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
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
    <section className="rounded-[12px] border bg-[var(--surface-muted)] p-5">
      <h2 className="text-lg font-medium text-[var(--heading)]">{title}</h2>
      {assets.length === 0 ? (
        <p className="mt-4 rounded-[12px] border border-dashed p-6 text-sm text-[var(--muted-foreground)]">
          Chưa có output nào trong nhóm này.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {assets.map((asset) => (
            <article key={asset.id} className="rounded-[12px] border bg-[var(--surface)] p-3">
              {asset.asset_type === "generated_image" ? (
                <Image
                  src={asset.file_url ?? asset.output_url ?? ""}
                  alt={asset.prompt ?? asset.file_name}
                  width={768}
                  height={768}
                  unoptimized
                  loading="lazy"
                  className="aspect-square w-full rounded-[8px] object-cover"
                />
              ) : (
                <video
                  src={asset.file_url ?? asset.output_url ?? ""}
                  controls
                  className="aspect-video w-full rounded-[8px] bg-black"
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

function resolvePreviewAsset(assets: ProjectAssetRecord[]) {
  const generatedVideo = assets.find(
    (asset) =>
      asset.asset_type === "generated_video" && (asset.file_url ?? asset.output_url),
  );
  if (generatedVideo) {
    return {
      type: "generated_video" as const,
      url: generatedVideo.file_url ?? generatedVideo.output_url ?? "",
      alt: generatedVideo.prompt ?? generatedVideo.file_name,
    };
  }

  const generatedImage = assets.find(
    (asset) =>
      asset.asset_type === "generated_image" && (asset.file_url ?? asset.output_url),
  );
  if (generatedImage) {
    return {
      type: "generated_image" as const,
      url: generatedImage.file_url ?? generatedImage.output_url ?? "",
      alt: generatedImage.prompt ?? generatedImage.file_name,
    };
  }

  return null;
}

function buildTimeline(
  renderJobs: RenderJobRecord[],
  generatedVideos: GeneratedVideoRecord[],
  exportJobs: ExportJobRecord[],
) {
  return [
    ...renderJobs.slice(0, 4).map((job) => ({
      id: `render-${job.id}`,
      label: "Render video",
      model: `${job.provider ?? "google"} · ${job.render_mode.replaceAll("_", " ")}`,
      status: job.status,
      time: new Date(job.created_at).toLocaleTimeString("vi-VN"),
      creditLabel: `${job.credit_cost} credits`,
    })),
    ...generatedVideos.slice(0, 2).map((video) => ({
      id: `video-${video.id}`,
      label: "Generated video",
      model: `${video.provider ?? "google"} · ${video.duration_seconds ?? "-"}s`,
      status: video.status,
      time: new Date(video.created_at).toLocaleTimeString("vi-VN"),
      creditLabel: "Saved output",
    })),
    ...exportJobs.slice(0, 2).map((job) => ({
      id: `export-${job.id}`,
      label: "Export video",
      model: `export · ${job.export_ratio}`,
      status: job.status,
      time: new Date(job.created_at).toLocaleTimeString("vi-VN"),
      creditLabel: `${job.credit_cost} credits`,
    })),
  ];
}

function formatTimelineStatus(status: string) {
  const labels: Record<string, string> = {
    completed: "Hoàn thành",
    processing: "Đang xử lý",
    failed: "Lỗi",
    cancelled: "Đã hủy",
    queued: "Chờ hàng",
  };

  return labels[status] ?? status;
}

function getTimelineStatusClass(status: string) {
  const base =
    "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]";
  if (status === "completed") {
    return `${base} border-[rgba(34,197,94,0.35)] text-[var(--success)]`;
  }
  if (status === "processing") {
    return `${base} border-[rgba(59,130,246,0.35)] text-[var(--processing)]`;
  }
  if (status === "queued") {
    return `${base} border-[rgba(245,158,11,0.35)] text-[var(--pending)]`;
  }
  return `${base} border-[rgba(248,113,113,0.35)] text-[var(--danger)]`;
}
