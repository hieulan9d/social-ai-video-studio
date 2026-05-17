import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService, KolService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";
import type { KolMaster } from "@/modules/ai-kol-system";
import { DeleteKolButton } from "./delete-kol-button";

export default async function KolsListPage() {
  const user = await requireUserProfile();
  const supabase = await createClient();

  const allKols: KolMaster[] = [];
  let loadError: FormattedError | null = null;

  try {
    const wsService = new WorkspaceService(supabase);
    const workspaces = await wsService.getUserWorkspaces(user.id);

    const kolService = new KolService(supabase);
    for (const ws of workspaces) {
      const kols = await kolService.getWorkspaceKols(ws.id);
      allKols.push(...kols);
    }
  } catch (error) {
    loadError = formatError(error);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">KOLs</h1>
          <p className="text-sm text-gray-500">AI KOL identity list</p>
        </div>
        <Link
          href="/kol-admin/kols/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
        >
          + Tạo KOL mới
        </Link>
      </div>

      {loadError && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Database chưa được khởi tạo" : "Lỗi tải dữ liệu"}
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

      <div className="space-y-2">
        <h2 className="font-semibold">Danh sách ({allKols.length})</h2>
        {allKols.length === 0 && !loadError && (
          <div className="text-sm text-gray-500 p-4 border border-white/10 rounded-lg">
            Chưa có KOL nào. Hãy{" "}
            <Link href="/kol-admin/workspaces" className="underline">
              tạo workspace
            </Link>{" "}
            trước, sau đó{" "}
            <Link href="/kol-admin/kols/new" className="underline">
              tạo KOL
            </Link>
            .
          </div>
        )}
        {allKols.map((k) => (
          <div key={k.id} className="border border-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {k.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={k.avatarUrl}
                    alt={k.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                    No
                    <br />
                    Avatar
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium">{k.name}</div>
                  <div className="text-sm text-gray-400">
                    Status: <span className="font-mono">{k.status}</span>
                    {k.slug && <span className="ml-3">Slug: <span className="font-mono">{k.slug}</span></span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono truncate">{k.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/kol-admin/kols/${k.id}/avatar`}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs font-medium whitespace-nowrap"
                >
                  🎨 Avatar Studio
                </Link>
                <DeleteKolButton kolId={k.id} kolName={k.name} />
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(k.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
