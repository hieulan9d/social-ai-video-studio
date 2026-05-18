import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService, KolService, CampaignService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError, KolMaster, Campaign } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";
import { CreateCampaignForm } from "./create-campaign-form";
import { Video, ArrowRight } from "lucide-react";

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
    const kolArrays = await Promise.all(
      workspaces.map((ws) => kolService.getWorkspaceKols(ws.id))
    );
    const allKols = kolArrays.flat();
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
        <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          {kolsWithCampaigns.length} KOLs · {totalCampaigns} campaigns
        </p>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="font-medium text-red-400">
            {loadError.isMissingTable ? "Database chưa được khởi tạo" : "Lỗi"}
          </div>
          <div className="text-sm text-zinc-400 mt-1">{loadError.message}</div>
        </div>
      )}

      {kolsWithCampaigns.length === 0 && !loadError && (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08]">
          <Video className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="font-semibold">Chưa có KOL nào</h3>
          <p className="text-sm text-zinc-500 mt-1">
            <Link href="/kol-admin/kols/new" className="text-indigo-400 hover:text-indigo-300 underline">Tạo KOL</Link> trước để bắt đầu tạo campaigns.
          </p>
        </div>
      )}

      {kolsWithCampaigns.map(({ kol, campaigns }) => (
        <div key={kol.id} className="rounded-2xl border border-white/[0.06] overflow-hidden">
          {/* KOL header */}
          <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02] border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              {kol.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kol.avatarUrl} alt={kol.name} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xs font-medium text-indigo-300">
                  {kol.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-medium text-sm">{kol.name}</div>
                <div className="text-[10px] text-zinc-500">{campaigns.length} campaigns</div>
              </div>
            </div>
            <Link
              href={`/kol-admin/kols/${kol.id}/avatar`}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Avatar Studio →
            </Link>
          </div>

          {/* Campaigns */}
          <div className="p-4 space-y-2">
            {campaigns.length === 0 && (
              <div className="text-xs text-zinc-600 italic py-2">Chưa có campaign nào.</div>
            )}
            {campaigns.map((c) => {
              const statusColor = {
                draft: "bg-zinc-500/10 text-zinc-400",
                planning: "bg-amber-500/10 text-amber-400",
                in_production: "bg-blue-500/10 text-blue-400",
                completed: "bg-emerald-500/10 text-emerald-400",
              }[c.status] || "bg-zinc-500/10 text-zinc-400";

              return (
                <Link
                  key={c.id}
                  href={`/kol-admin/campaigns/${c.id}`}
                  className="group flex items-center justify-between p-3 rounded-xl border border-white/[0.04] hover:border-indigo-500/20 hover:bg-indigo-500/[0.02] transition-all"
                >
                  <div>
                    <div className="text-sm font-medium group-hover:text-white transition-colors">{c.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.platform && <span className="text-[10px] text-zinc-500">{c.platform}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColor}`}>{c.status}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                </Link>
              );
            })}

            <CreateCampaignForm kolId={kol.id} workspaceId={kol.workspaceId} />
          </div>
        </div>
      ))}
    </div>
  );
}
