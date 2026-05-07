import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectDeleteButton } from "@/components/projects/project-delete-button";
import { PromptEditor } from "@/components/projects/prompt-editor";
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
            Project workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            {project.platform} · {project.videoType.replaceAll("_", " ")} ·{" "}
            {project.duration}s · {project.language}
            {project.style ? ` · ${project.style}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ProjectStatusBadge status={project.status} />
          <Link
            href="/projects"
            className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted-foreground)]"
          >
            Back to projects
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
                "No brief has been written for this project yet. Add the product angle, target audience, and messaging here in the next iteration."
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
            <ListSection
              title="Assets"
              emptyMessage="No project assets uploaded yet."
              items={detail.assets.map((asset) => ({
                key: asset.id,
                title: asset.file_name || asset.asset_type.replaceAll("_", " "),
                description: asset.file_url || "No storage URL yet.",
                meta: [asset.asset_type, asset.mime_type],
              }))}
            />
          ) : null}

          {activeTab === "render" ? (
            <ListSection
              title="Render jobs"
              emptyMessage="No render jobs created yet."
              items={detail.renderJobs.map((job) => ({
                key: job.id,
                title: `${job.status} render job`,
                description:
                  job.error_message ||
                  job.provider_job_id ||
                  "No provider job id or error message yet.",
                meta: [job.provider, job.started_at, job.completed_at],
              }))}
            />
          ) : null}

          {activeTab === "export" ? (
            <ListSection
              title="Generated videos"
              emptyMessage="No generated videos exported yet."
              items={detail.generatedVideos.map((video) => ({
                key: video.id,
                title: `Export ${video.status}`,
                description: video.file_url || "No export file URL yet.",
                meta: [
                  video.thumbnail_url,
                  video.duration_seconds ? `${video.duration_seconds}s` : null,
                ],
              }))}
            />
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Project overview</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <OverviewCard label="Platform" value={project.platform} />
            <OverviewCard
              label="Video type"
              value={project.videoType.replaceAll("_", " ")}
            />
            <OverviewCard label="Duration" value={`${project.duration} seconds`} />
            <OverviewCard label="Language" value={project.language} />
            <OverviewCard label="Style" value={project.style || "Not set"} />
            <OverviewCard
              label="Updated"
              value={new Date(project.updatedAt).toLocaleString()}
            />
          </div>

          <div className="mt-6 space-y-3">
            {[
              `Script entries: ${detail.script ? 1 : 0}`,
              `Scene count: ${detail.scenes.length}`,
              `Prompt count: ${detail.prompts.length}`,
              `Asset count: ${detail.assets.length}`,
              `Render jobs: ${detail.renderJobs.length}`,
              `Exports: ${detail.generatedVideos.length}`,
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

function ListSection({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: Array<{
    key: string;
    title: string;
    description: string;
    meta: Array<string | null | undefined>;
  }>;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-6 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-foreground)]">
                {item.description}
              </p>
              {item.meta.filter(Boolean).length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.meta.filter(Boolean).map((metaItem) => (
                    <span
                      key={metaItem}
                      className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]"
                    >
                      {metaItem}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
            {emptyMessage}
          </div>
        )}
      </div>
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
