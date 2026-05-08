import { PromptStudio } from "@/components/quick-create/prompt-studio";
import { QuickStudioNav } from "@/components/quick-create/quick-studio-nav";
import {
  isQuickGenerationHistoryAvailable,
  listQuickGenerations,
} from "@/lib/ai/quick-generations";
import { requireUserProfile } from "@/lib/auth/server";

export default async function PromptStudioPage() {
  const user = await requireUserProfile();
  const historyAvailable = await isQuickGenerationHistoryAvailable();
  const history = historyAvailable
    ? await listQuickGenerations({
        userId: user.id,
        type: "prompt",
        limit: 12,
      })
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            AI Studio nhanh
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tao Prompt AI
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Nhap mot y tuong don gian de ChatGPT phan tich va chuyen thanh prompt chi
            tiet cho AI image hoac video generation.
          </p>
        </div>
        <QuickStudioNav active="prompt" />
      </div>

      <PromptStudio initialHistory={history} historyAvailable={historyAvailable} />
    </div>
  );
}
