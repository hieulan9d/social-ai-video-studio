import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUserProfile } from "@/lib/auth/server";
import { KolService, formatError, IdentityLockService } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { AvatarStudio } from "./avatar-studio";

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
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
            KOL not found.
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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/kol-admin/kols"
            className="text-xs text-gray-400 hover:text-white"
          >
            ← Back to KOLs
          </Link>
          <h1 className="text-2xl font-bold mt-1">Avatar Studio: {kolName}</h1>
          <p className="text-sm text-gray-500">
            Iteratively create and refine the KOL&apos;s permanent avatar identity.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Database chưa có table avatar" : "Lỗi"}
          </div>
          <div className="text-sm text-gray-400 mt-1">{loadError.message}</div>
          {loadError.code && (
            <div className="text-xs text-gray-500 mt-1 font-mono">Code: {loadError.code}</div>
          )}
          {loadError.isMissingTable && (
            <Link href="/kol-admin/system-test" className="text-xs underline text-yellow-400 mt-2 block">
              → Chạy migration 003_avatar_generation.sql tại System Test
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
