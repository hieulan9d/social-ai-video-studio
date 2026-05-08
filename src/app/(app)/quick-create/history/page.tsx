import { QuickHistoryList } from "@/components/quick-create/quick-history-list";
import { QuickStudioNav } from "@/components/quick-create/quick-studio-nav";
import { listQuickGenerations } from "@/lib/ai/quick-generations";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";

export default async function QuickHistoryPage() {
  const user = await requireUserProfile();
  const [generations, projects] = await Promise.all([
    listQuickGenerations({ userId: user.id, limit: 50 }),
    getProjects(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            AI Studio nhanh
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            History
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Quản lý toàn bộ ảnh và video đã tạo nhanh ngoài project mode.
          </p>
        </div>
        <QuickStudioNav active="history" />
      </div>

      <QuickHistoryList initialGenerations={generations} projects={projects} />
    </div>
  );
}
