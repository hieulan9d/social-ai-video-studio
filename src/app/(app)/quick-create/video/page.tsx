import { QuickStudioNav } from "@/components/quick-create/quick-studio-nav";
import { QuickVideoStudio } from "@/components/quick-create/quick-video-studio";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { requireUserProfile } from "@/lib/auth/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { getProjects } from "@/lib/projects/server";

export default async function QuickVideoPage() {
  let pageData;

  try {
    const user = await requireUserProfile();
    const [projects, videoCreditCost, imageToVideoCreditCost, transitionVideoCreditCost] =
      await Promise.all([
        getProjects(user.id),
        getFeatureCreditCost("veo_render"),
        getFeatureCreditCost("image_to_video"),
        getFeatureCreditCost("transition_video"),
      ]);
    pageData = {
      projects,
      videoCreditCost,
      imageToVideoCreditCost,
      transitionVideoCreditCost,
    };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Quick video page load failed:", error);
    return <ServerDataFallback />;
  }

  const {
    projects,
    videoCreditCost,
    imageToVideoCreditCost,
    transitionVideoCreditCost,
  } = pageData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Quick create
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-[var(--heading)] sm:text-4xl">
            Tạo video không cần tạo dự án
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Tạo video ngắn bằng prompt, ảnh tham chiếu hoặc workflow Start/End Image to Video rồi lưu lại vào project khi cần.
          </p>
        </div>
        <QuickStudioNav active="video" />
      </div>

      <QuickVideoStudio
        projects={projects}
        estimatedCreditCost={videoCreditCost}
        imageToVideoCreditCost={imageToVideoCreditCost}
        transitionVideoCreditCost={transitionVideoCreditCost}
      />
    </div>
  );
}
