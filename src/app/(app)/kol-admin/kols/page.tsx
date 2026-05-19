import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService, KolService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";
import type { KolMaster } from "@/modules/ai-kol-system";
import { DeleteKolButton } from "./delete-kol-button";
import { VoicePresetSelector } from "./voice-preset-selector";
import { Plus, Sparkles } from "lucide-react";

export default async function KolsListPage() {
  const user = await requireUserProfile();
  const supabase = await createClient();

  const allKols: KolMaster[] = [];
  let loadError: FormattedError | null = null;

  try {
    const wsService = new WorkspaceService(supabase);
    const workspaces = await wsService.getUserWorkspaces(user.id);

    const kolService = new KolService(supabase);
    const kolArrays = await Promise.all(
      workspaces.map((ws) => kolService.getWorkspaceKols(ws.id))
    );
    allKols.push(...kolArrays.flat());
  } catch (error) {
    loadError = formatError(error);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI KOLs</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Quản lý nhân vật AI KOL của bạn</p>
        </div>
        <Link
          href="/kol-admin/kols/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          Tạo KOL mới
        </Link>
      </div>

      {/* Error */}
      {loadError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Database chưa được khởi tạo" : "Lỗi tải dữ liệu"}
          </div>
          <div className="text-sm text-zinc-400 mt-1">{loadError.message}</div>
          {loadError.isMissingTable && (
            <Link href="/kol-admin/system-test" className="text-xs underline text-amber-400 mt-2 block">
              → Chạy migration tại System Test
            </Link>
          )}
        </div>
      )}

      {/* Empty state */}
      {allKols.length === 0 && !loadError && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="font-semibold text-lg">Chưa có KOL nào</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            Tạo workspace trước, sau đó tạo KOL đầu tiên với avatar AI.
          </p>
          <div className="flex gap-3 justify-center mt-5">
            <Link href="/kol-admin/workspaces" className="px-4 py-2 border border-white/[0.08] rounded-lg text-sm hover:bg-white/[0.03]">
              Tạo Workspace
            </Link>
            <Link href="/kol-admin/kols/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium">
              Tạo KOL
            </Link>
          </div>
        </div>
      )}

      {/* KOL Grid */}
      {allKols.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {allKols.map((k) => (
            <div
              key={k.id}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {k.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={k.avatarUrl}
                    alt={k.name}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/[0.06] group-hover:ring-indigo-500/20 transition-all"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-lg font-semibold text-zinc-500">
                    {k.name.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{k.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      k.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                    }`}>
                      {k.status === "active" ? "Active" : "Draft"}
                    </span>
                  </div>

                  {k.slug && (
                    <div className="text-xs text-zinc-500 mt-0.5 font-mono">@{k.slug}</div>
                  )}

                  {/* Voice preset */}
                  <div className="mt-2">
                    <VoicePresetSelector
                      kolId={k.id}
                      currentPreset={(k.settings as Record<string, unknown>)?.voice_preset as string | null}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                <Link
                  href={`/kol-admin/kols/${k.id}/avatar`}
                  className="flex-1 text-center px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-lg text-xs font-medium text-indigo-300 transition-colors"
                >
                  🎨 Avatar Studio
                </Link>
                <DeleteKolButton kolId={k.id} kolName={k.name} />
                <div className="text-[10px] text-zinc-600 ml-auto">
                  {new Date(k.createdAt).toLocaleDateString("vi-VN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
