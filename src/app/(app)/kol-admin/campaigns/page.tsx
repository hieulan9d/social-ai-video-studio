import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService, KolService, CampaignService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError, KolMaster, Campaign } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";
import { CreateCampaignForm } from "./create-campaign-form";

type KolWithCampaigns = {
  kol: KolMaster;
  campaigns: Campaign[];
};

export default async function CampaignsListPage() {
  const user = await requireUserProfile();
  const supabase = await createClient();

  const kolsWithCampaigns: KolWithCampaigns[] = [];
  let loadError: FormattedError | null = null;

  try {
    const wsService = new WorkspaceService(supabase);
    const kolService = new KolService(supabase);
    const campaignService = new CampaignService(supabase);

    const workspaces = await wsService.getUserWorkspaces(user.id);

    // Fetch all KOLs in parallel across workspaces
    const kolArrays = await Promise.all(
      workspaces.map((ws) => kolService.getWorkspaceKols(ws.id))
    );
    const allKols = kolArrays.flat();

    // Fetch all campaigns in parallel across KOLs
    const campaignArrays = await Promise.all(
      allKols.map((kol) => campaignService.getKolCampaigns(kol.id))
    );

    allKols.forEach((kol, i) => {
      kolsWithCampaigns.push({ kol, campaigns: campaignArrays[i] });
    });
  } catch (error) {
    loadError = formatError(error);
  }

  const totalCampaigns = kolsWithCampaigns.reduce((sum, k) => sum + k.campaigns.length, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-sm text-gray-500">
          {kolsWithCampaigns.length} KOLs · {totalCampaigns} campaigns
        </p>
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

      {kolsWithCampaigns.length === 0 && !loadError && (
        <div className="text-sm text-gray-500 p-4 border border-white/10 rounded-lg">
          Chưa có KOL nào. Hãy{" "}
          <Link href="/kol-admin/kols/new" className="underline">
            tạo KOL
          </Link>{" "}
          trước.
        </div>
      )}

      {kolsWithCampaigns.map(({ kol, campaigns }) => (
        <div key={kol.id} className="border border-white/10 rounded-lg overflow-hidden">
          {/* KOL header */}
          <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              {kol.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kol.avatarUrl} alt={kol.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-gray-500">
                  KOL
                </div>
              )}
              <div>
                <div className="font-medium text-sm">{kol.name}</div>
                <div className="text-xs text-gray-500">{campaigns.length} campaigns</div>
              </div>
            </div>
            <Link
              href={`/kol-admin/kols/${kol.id}/avatar`}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Avatar Studio →
            </Link>
          </div>

          {/* Campaigns list */}
          <div className="p-3 space-y-2">
            {campaigns.length === 0 && (
              <div className="text-xs text-gray-500 italic">Chưa có campaign nào cho KOL này.</div>
            )}
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/kol-admin/campaigns/${c.id}`}
                className="flex items-center justify-between p-2 border border-white/5 rounded hover:bg-white/5 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">
                    {c.platform && <span className="mr-2">{c.platform}</span>}
                    <span className="font-mono">{c.status}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}

            {/* Create campaign form */}
            <CreateCampaignForm kolId={kol.id} workspaceId={kol.workspaceId} />
          </div>
        </div>
      ))}
    </div>
  );
}
