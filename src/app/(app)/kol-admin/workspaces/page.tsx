import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";
import { createWorkspaceAction } from "./actions";
import { FolderKanban, Plus } from "lucide-react";

export default async function WorkspacesPage() {
  const user = await requireUserProfile();
  const supabase = await createClient();

  let workspaces: Awaited<ReturnType<WorkspaceService["getUserWorkspaces"]>> = [];
  let loadError: FormattedError | null = null;

  try {
    const service = new WorkspaceService(supabase);
    workspaces = await service.getUserWorkspaces(user.id);
  } catch (error) {
    loadError = formatError(error);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Quản lý workspace cho KOL system</p>
      </div>

      {/* Create form */}
      <form action={createWorkspaceAction} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Plus className="h-4 w-4 text-indigo-400" />
          </div>
          <h2 className="font-semibold">Tạo workspace mới</h2>
        </div>
        <input
          name="name"
          required
          placeholder="Tên workspace"
          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm placeholder:text-zinc-600 focus:border-indigo-500/30 focus:bg-white/[0.05]"
        />
        <textarea
          name="description"
          placeholder="Mô tả (tùy chọn)"
          rows={2}
          className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm placeholder:text-zinc-600 focus:border-indigo-500/30 focus:bg-white/[0.05] resize-none"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all"
        >
          Tạo workspace
        </button>
      </form>

      {/* Error */}
      {loadError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Database chưa được khởi tạo" : "Lỗi"}
          </div>
          <div className="text-sm text-zinc-400 mt-1">{loadError.message}</div>
          {loadError.isMissingTable && (
            <Link href="/kol-admin/system-test" className="text-xs underline text-amber-400 mt-2 block">
              → Chạy migration tại System Test
            </Link>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        <h2 className="font-semibold text-zinc-300">Danh sách ({workspaces.length})</h2>
        {workspaces.length === 0 && !loadError && (
          <div className="text-center py-10 rounded-xl border border-dashed border-white/[0.08]">
            <FolderKanban className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Chưa có workspace nào. Tạo workspace đầu tiên ở trên.</p>
          </div>
        )}
        {workspaces.map((w) => (
          <div key={w.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-indigo-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{w.name}</div>
                {w.description && (
                  <div className="text-sm text-zinc-500 mt-0.5">{w.description}</div>
                )}
                <div className="text-[10px] text-zinc-600 mt-1 font-mono">{w.id}</div>
              </div>
              <div className="text-xs text-zinc-600">
                {new Date(w.createdAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
