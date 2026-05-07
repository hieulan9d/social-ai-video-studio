import Link from "next/link";
import { RenderHistory } from "@/components/projects/render-panel";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import {
  listGeneratedVideosForUser,
  listRenderHistory,
} from "@/lib/render/server";

export default async function RenderHistoryPage() {
  const user = await requireUserProfile();
  const [renderJobs, generatedVideos] = await Promise.all([
    listRenderHistory(user.id),
    listGeneratedVideosForUser(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            Render operations
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Render history
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Review text-to-video render jobs, refresh long-running jobs, and
            download completed outputs.
          </p>
        </div>
        <Link
          href="/projects"
          className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted-foreground)]"
        >
          Back to projects
        </Link>
      </div>

      <SurfaceCard>
        <RenderHistory
          renderJobs={renderJobs}
          generatedVideos={generatedVideos}
        />
      </SurfaceCard>
    </div>
  );
}
