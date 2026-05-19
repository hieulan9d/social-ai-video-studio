import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUserProfile } from "@/lib/auth/server";
import { CampaignService, KolService, IdentityLockService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { ScriptGenerator } from "./script-generator";
import { CampaignStudio } from "./campaign-studio";
import { ArrowLeft, FileText, Film, Wand2, Activity } from "lucide-react";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await requireUserProfile();
  const supabase = await createClient();

  let campaign = null;
  let kolName = "";
  let kolAvatarUrl: string | null = null;
  let scripts: Awaited<ReturnType<CampaignService["getScripts"]>> = [];
  let scenes: Awaited<ReturnType<CampaignService["getScenes"]>> = [];
  let prompts: Awaited<ReturnType<CampaignService["getPrompts"]>> = [];
  let campaignAssets: { id: string; file_url: string | null; name: string; asset_type: string }[] = [];
  let loadError: FormattedError | null = null;

  try {
    const campaignService = new CampaignService(supabase);
    campaign = await campaignService.getCampaign(campaignId);

    if (!campaign) {
      return (
        <div className="p-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            Campaign không tồn tại.
          </div>
        </div>
      );
    }

    const kolService = new KolService(supabase);
    const [kol, scriptsResult, scenesResult, promptsResult, assetsResult, lockResult] = await Promise.all([
      kolService.getKol(campaign.kolId),
      campaignService.getScripts(campaignId),
      campaignService.getScenes(campaignId),
      campaignService.getPrompts(campaignId),
      campaignService.getAssets(campaignId).catch(() => []),
      new IdentityLockService(supabase).getLock(campaign.kolId).catch(() => null),
    ]);

    kolName = kol?.name || "Unknown KOL";
    kolAvatarUrl = kol?.avatarUrl || null;
    if (lockResult?.official_avatar_url) {
      kolAvatarUrl = lockResult.official_avatar_url;
    }

    scripts = scriptsResult;
    scenes = scenesResult;
    prompts = promptsResult;
    campaignAssets = assetsResult.map((a) => ({
      id: a.id,
      file_url: a.file_url,
      name: a.name,
      asset_type: a.asset_type,
    }));
  } catch (error) {
    loadError = formatError(error);
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="font-medium text-red-400">Lỗi</div>
          <div className="text-sm text-zinc-400 mt-1">{loadError.message}</div>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const activeScript = scripts.find((s) => s.is_active) || scripts[0];
  const statusColor = {
    draft: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    planning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    in_production: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    review: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    archived: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  }[campaign.status] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/kol-admin/campaigns" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          Quay lại
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${statusColor}`}>
            {campaign.status}
          </span>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          KOL: <span className="text-zinc-300">{kolName}</span>
          {campaign.platform && <> · Platform: <span className="text-zinc-300">{campaign.platform}</span></>}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<FileText className="h-4 w-4" />} value={scripts.length} label="Kịch bản" />
        <StatCard icon={<Film className="h-4 w-4" />} value={scenes.length} label="Phân cảnh" />
        <StatCard icon={<Wand2 className="h-4 w-4" />} value={prompts.length} label="Prompts" />
        <StatCard icon={<Activity className="h-4 w-4" />} value={campaignAssets.length} label="Assets" />
      </div>

      {/* Campaign Studio */}
      <CampaignStudio
        campaignId={campaignId}
        kolId={campaign.kolId}
        kolAvatarUrl={kolAvatarUrl}
      />

      {/* Script Generator */}
      <ScriptGenerator
        campaignId={campaignId}
        kolId={campaign.kolId}
        platform={campaign.platform || "TikTok"}
        contentType={campaign.contentType || "commercial"}
        existingScript={activeScript || null}
        existingScenes={scenes}
        campaignAssets={campaignAssets}
      />
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="text-zinc-500">{icon}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
      <div className="text-[11px] text-zinc-500 mt-1.5">{label}</div>
    </div>
  );
}
