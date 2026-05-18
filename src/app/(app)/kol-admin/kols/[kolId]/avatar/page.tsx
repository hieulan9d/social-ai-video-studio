import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUserProfile } from "@/lib/auth/server";
import { KolService, formatError, IdentityLockService } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { AvatarStudio } from "./avatar-studio";
import { ArrowLeft, Wand2 } from "lucide-react";

export default async function KolAvatarPage({
  params,
}: {
  params: Promise<{ kolId: string }>;
}) {
  const { kolId } = await params;
  const user = await requireUserProfile();
  const supabase = await createClient();

  let kolName = "";
  let existingLock = null;
  let loadError: FormattedError | null = null;

  try {
    const kolService = new KolService(supabase);
    const kol = await kolService.getKol(kolId);
    if (!kol) {
      return (
        <div className="p-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400">
            KOL không tồn tại.
          </div>
        </div>
      );
    }
    kolName = kol.name;

    const lockService = new IdentityLockService(supabase);
    existingLock = await lockService.getLock(kolId);
  } catch (error) {
    loadError = formatError(error);
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <Link
          href="/kol-admin/kols"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Quay lại KOLs
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Avatar Studio</h1>
            <p className="text-sm text-zinc-500">{kolName} — Tạo và tinh chỉnh avatar AI</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Cần chạy migration" : "Lỗi"}
          </div>
          <div className="text-sm text-zinc-400 mt-1">{loadError.message}</div>
          {loadError.isMissingTable && (
            <Link href="/kol-admin/system-test" className="text-xs underline text-amber-400 mt-2 block">
              → Chạy migration 003 tại System Test
            </Link>
          )}
        </div>
      )}

      {!loadError && (
        <AvatarStudio
          kolId={kolId}
          kolName={kolName}
          userId={user.id}
          existingLock={existingLock}
        />
      )}
    </div>
  );
}
