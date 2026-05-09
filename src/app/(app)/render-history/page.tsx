import Link from "next/link";
import { RenderHistory } from "@/components/projects/render-panel";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import {
  listGeneratedVideosForUser,
  listRenderHistory,
} from "@/lib/render/server";

export default async function RenderHistoryPage() {
  let pageData;

  try {
    const user = await requireUserProfile();
    const [renderJobs, generatedVideos] = await Promise.all([
      listRenderHistory(user.id),
      listGeneratedVideosForUser(user.id),
    ]);
    pageData = { renderJobs, generatedVideos };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Render history page load failed:", error);
    return <ServerDataFallback />;
  }

  const { renderJobs, generatedVideos } = pageData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            Vận hành render
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Lịch sử render
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            Xem các job render text-to-video, làm mới job chạy lâu và tải xuống
            output đã hoàn tất.
          </p>
        </div>
        <Link
          href="/projects"
          className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted-foreground)]"
        >
          Quay lại dự án
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
