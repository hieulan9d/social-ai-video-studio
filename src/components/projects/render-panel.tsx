import {
  Download,
  RefreshCw,
  Video,
} from "lucide-react";
import { ImageToVideoForm } from "@/components/projects/image-to-video-form";
import { StartEndTransitionForm } from "@/components/projects/start-end-transition-form";
import {
  startTextToVideoRenderAction,
  syncRenderJobAction,
} from "@/lib/render/actions";
import type {
  GeneratedVideoRecord,
  Project,
  ProjectAssetRecord,
  PromptRecord,
  RenderJobRecord,
  SceneRecord,
} from "@/lib/projects/types";

export function RenderPanel({
  project,
  scenes,
  prompts,
  assets,
  renderJobs,
  generatedVideos,
}: {
  project: Project;
  scenes: SceneRecord[];
  prompts: PromptRecord[];
  assets: ProjectAssetRecord[];
  renderJobs: RenderJobRecord[];
  generatedVideos: GeneratedVideoRecord[];
}) {
  const renderablePrompts = prompts.filter((prompt) => prompt.scene_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Text-to-video rendering</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Select a Veo prompt, spend render credits, and create a backend render
          job. Provider credentials stay on the server.
        </p>
      </div>

      <ImageToVideoForm projectId={project.id} assets={assets} />
      <StartEndTransitionForm projectId={project.id} assets={assets} />

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
            <Video className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">Create a render job</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Text-to-video currently uses one scene prompt per job. Failed
              provider renders refund credits automatically.
            </p>
          </div>
        </div>

        {renderablePrompts.length > 0 ? (
          <div className="mt-5 space-y-4">
            {renderablePrompts.map((prompt) => {
              const scene = scenes.find((item) => item.id === prompt.scene_id);

              return (
                <form
                  key={prompt.id}
                  action={startTextToVideoRenderAction}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="promptId" value={prompt.id} />
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">
                        Scene {scene?.scene_order ?? "unknown"} prompt
                      </p>
                      <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--muted-foreground)]">
                        {prompt.content}
                      </p>
                    </div>
                    <button
                      type="submit"
                      className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
                    >
                      Render scene
                    </button>
                  </div>
                </form>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
            No scene prompts are ready. Generate Veo prompts before rendering.
          </div>
        )}
      </div>

      <RenderHistory
        projectId={project.id}
        renderJobs={renderJobs}
        generatedVideos={generatedVideos}
      />
    </div>
  );
}

export function RenderHistory({
  projectId,
  renderJobs,
  generatedVideos,
}: {
  projectId?: string;
  renderJobs: RenderJobRecord[];
  generatedVideos: GeneratedVideoRecord[];
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold">Render history</h3>
      <div className="mt-4 space-y-4">
        {renderJobs.length > 0 ? (
          renderJobs.map((job) => {
            const video = generatedVideos.find(
              (item) => item.render_job_id === job.id,
            );

            return (
              <div
                key={job.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getStatusClass(job.status)}>
                        {job.status}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {job.provider || "unknown provider"}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {job.render_mode.replaceAll("_", " ")}
                      </span>
                      {job.motion_style ? (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {job.motion_style.replaceAll("_", " ")}
                        </span>
                      ) : null}
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {job.credit_cost} credits
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">
                      {job.prompt_snapshot || "No prompt snapshot saved."}
                    </p>
                    {job.error_message ? (
                      <p className="mt-3 text-sm text-rose-300">
                        {job.error_message}
                      </p>
                    ) : null}
                    {video?.file_url ? (
                      <video
                        controls
                        src={video.file_url}
                        className="mt-4 aspect-video w-full max-w-xl rounded-2xl border border-[var(--border)] bg-black"
                      />
                    ) : null}
                    <p className="mt-3 break-all text-xs text-[var(--muted-foreground)]">
                      {job.provider_operation_name || job.provider_job_id || job.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.status === "queued" || job.status === "processing" ? (
                      <form action={syncRenderJobAction}>
                        <input type="hidden" name="renderJobId" value={job.id} />
                        {projectId ? (
                          <input type="hidden" name="projectId" value={projectId} />
                        ) : null}
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2 text-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </button>
                      </form>
                    ) : null}

                    {video?.file_url ? (
                      <a
                        href={video.file_url}
                        download
                        className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)]"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
            No render jobs have been created yet.
          </div>
        )}
      </div>
    </div>
  );
}

function getStatusClass(status: RenderJobRecord["status"]) {
  const base = "rounded-full px-3 py-1 text-xs font-medium capitalize";

  if (status === "completed") {
    return `${base} bg-emerald-500/10 text-emerald-300`;
  }

  if (status === "failed") {
    return `${base} bg-rose-500/10 text-rose-300`;
  }

  if (status === "processing") {
    return `${base} bg-sky-500/10 text-sky-300`;
  }

  return `${base} bg-amber-500/10 text-amber-200`;
}
