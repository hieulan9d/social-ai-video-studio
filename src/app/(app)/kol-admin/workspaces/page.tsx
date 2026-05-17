import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";
import { createWorkspaceAction } from "./actions";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-sm text-gray-500">Quản lý workspace cho KOL system</p>
        </div>
      </div>

      <form action={createWorkspaceAction} className="border border-white/10 rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Tạo workspace mới</h2>
        <input
          name="name"
          required
          placeholder="Tên workspace"
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
        />
        <textarea
          name="description"
          placeholder="Mô tả (tùy chọn)"
          rows={2}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
        >
          Tạo workspace
        </button>
      </form>

      {loadError && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Database chưa được khởi tạo" : "Lỗi tải workspaces"}
          </div>
          <div className="text-sm text-gray-400 mt-1">{loadError.message}</div>
          {loadError.code && (
            <div className="text-xs text-gray-500 mt-1 font-mono">Code: {loadError.code}</div>
          )}
          {loadError.hint && (
            <div className="text-xs text-gray-500 mt-1">Hint: {loadError.hint}</div>
          )}
          {loadError.isMissingTable && (
            <div className="text-xs text-yellow-400 mt-3 p-2 border border-yellow-500/30 bg-yellow-500/10 rounded">
              <div className="font-medium">⚠ Cần chạy SQL migration</div>
              <div className="mt-1">
                Mở file{" "}
                <code className="text-xs">
                  src/modules/ai-kol-system/database/migrations/001_core_foundation.sql
                </code>
                {" "}và chạy nội dung trong Supabase SQL Editor.
              </div>
              <Link href="/kol-admin/system-test" className="underline block mt-2">
                → Mở System Test để xem chi tiết
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">Danh sách ({workspaces.length})</h2>
        {workspaces.length === 0 && !loadError && (
          <div className="text-sm text-gray-500 p-4 border border-white/10 rounded-lg">
            Chưa có workspace nào. Tạo workspace đầu tiên ở trên.
          </div>
        )}
        {workspaces.map((w) => (
          <div key={w.id} className="border border-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{w.name}</div>
                {w.description && (
                  <div className="text-sm text-gray-400">{w.description}</div>
                )}
                <div className="text-xs text-gray-500 mt-1 font-mono">{w.id}</div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(w.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
