import { PromptStudio } from "@/components/quick-create/prompt-studio";
import { QuickStudioNav } from "@/components/quick-create/quick-studio-nav";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import {
  isQuickGenerationHistoryAvailable,
  listQuickGenerations,
} from "@/lib/ai/quick-generations";
import { requireUserProfile } from "@/lib/auth/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";

export default async function PromptStudioPage() {
  let pageData;

  try {
    const user = await requireUserProfile();
    const historyAvailable = await isQuickGenerationHistoryAvailable();
    const history = historyAvailable
      ? await listQuickGenerations({
          userId: user.id,
          type: "prompt",
          limit: 12,
        })
      : [];
    pageData = { history, historyAvailable };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Prompt studio page load failed:", error);
    return <ServerDataFallback />;
  }

  const { history, historyAvailable } = pageData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
            Prompt lab
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-[var(--heading)] sm:text-4xl">
            Tạo Prompt AI
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Nhập một ý tưởng đơn giản để AI phân tích và chuyển thành prompt chi tiết cho image, video hoặc shot list.
          </p>
        </div>
        <QuickStudioNav active="prompt" />
      </div>

      <PromptStudio initialHistory={history} historyAvailable={historyAvailable} />
    </div>
  );
}
