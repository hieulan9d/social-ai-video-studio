import { QuickImageStudio } from "@/components/quick-create/quick-image-studio";
import { QuickStudioNav } from "@/components/quick-create/quick-studio-nav";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";

export default async function QuickImagePage() {
  const user = await requireUserProfile();
  const projects = await getProjects(user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            AI Studio nhanh
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tạo ảnh không cần tạo dự án
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Tạo ảnh nhanh qua 9router, xem preview, tải xuống hoặc lưu output vào một dự án hiện có.
          </p>
        </div>
        <QuickStudioNav active="image" />
      </div>

      <QuickImageStudio projects={projects} />
    </div>
  );
}
