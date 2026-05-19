import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";
import { createKolAction } from "./actions";

export default async function NewKolPage() {
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
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Tạo KOL mới</h1>
        <p className="text-sm text-gray-500">Khởi tạo một AI KOL identity</p>
      </div>

      {loadError && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Database chưa được khởi tạo" : "Lỗi tải workspaces"}
          </div>
          <div className="text-sm text-gray-400 mt-1">{loadError.message}</div>
          {loadError.code && (
            <div className="text-xs text-gray-500 mt-1 font-mono">Code: {loadError.code}</div>
          )}
          {loadError.isMissingTable && (
            <Link href="/kol-admin/system-test" className="text-xs underline text-yellow-400 mt-2 block">
              → Chạy migration tại System Test
            </Link>
          )}
        </div>
      )}

      {workspaces.length === 0 && !loadError && (
        <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4">
          <div className="font-medium text-yellow-400">Chưa có workspace</div>
          <div className="text-sm text-gray-400 mt-1">
            Bạn cần tạo workspace trước khi tạo KOL.{" "}
            <Link href="/kol-admin/workspaces" className="underline">
              Tạo workspace
            </Link>
          </div>
        </div>
      )}

      {workspaces.length > 0 && (
        <form action={createKolAction} className="border border-white/10 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Workspace *</label>
            <select
              name="workspace_id"
              required
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id} className="bg-gray-900">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tên KOL *</label>
            <input
              name="name"
              required
              placeholder="e.g. Anna - Beauty Influencer"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug (tùy chọn)</label>
            <input
              name="slug"
              placeholder="e.g. anna-beauty"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Để trống để tự sinh từ tên</p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h3 className="font-medium mb-2 text-sm">Identity DNA (tùy chọn)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-400">Gender</label>
                <input
                  name="gender"
                  placeholder="female / male"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-400">Age appearance</label>
                <input
                  name="age_appearance"
                  placeholder="e.g. early 20s"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-400">Ethnicity</label>
                <input
                  name="ethnicity"
                  placeholder="e.g. Vietnamese"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-400">Hairstyle</label>
                <input
                  name="hairstyle"
                  placeholder="e.g. long black hair"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
            >
              Tạo KOL & mở Avatar Studio
            </button>
            <Link
              href="/kol-admin/kols"
              className="px-4 py-2 border border-white/10 rounded text-sm hover:bg-white/5"
            >
              Hủy
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            Sau khi tạo, bạn sẽ được chuyển đến Avatar Studio để generate avatar bằng NanoBanana.
          </p>
        </form>
      )}
    </div>
  );
}
