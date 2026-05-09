import { QuickImageStudio } from "@/components/quick-create/quick-image-studio";
import { QuickStudioNav } from "@/components/quick-create/quick-studio-nav";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { requireUserProfile } from "@/lib/auth/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { getProjects } from "@/lib/projects/server";

export default async function QuickImagePage() {
  let pageData;

  try {
    const user = await requireUserProfile();
    const [projects, imageCreditCost] = await Promise.all([
      getProjects(user.id),
      getFeatureCreditCost("image_generation"),
    ]);
    pageData = { projects, imageCreditCost };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Quick image page load failed:", error);
    return <ServerDataFallback />;
  }

  const { projects, imageCreditCost } = pageData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Quick create
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-[var(--heading)] sm:text-4xl">
            Tạo ảnh không cần tạo dự án
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Tạo ảnh nhanh bằng model hiện có, xem preview, tải xuống hoặc lưu output vào dự án đang làm.
          </p>
        </div>
        <QuickStudioNav active="image" />
      </div>

      <QuickImageStudio projects={projects} estimatedCreditCost={imageCreditCost} />
    </div>
  );
}
