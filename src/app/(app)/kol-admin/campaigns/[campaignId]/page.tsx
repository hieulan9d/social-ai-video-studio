import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUserProfile } from "@/lib/auth/server";
import { CampaignService, KolService, IdentityLockService, formatError } from "@/modules/ai-kol-system";
import type { FormattedError } from "@/modules/ai-kol-system";
import { ScriptGenerator } from "./script-generator";
import { CampaignStudio } from "./campaign-studio";

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
  let loadError: FormattedError | null = null;

  try {
    const campaignService = new CampaignService(supabase);
    campaign = await campaignService.getCampaign(campaignId);

    if (!campaign) {
      return (
        <div className="p-6">
          <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
            Campaign not found.
          </div>
        </div>
      );
    }

    const kolService = new KolService(supabase);
    const kol = await kolService.getKol(campaign.kolId);
    kolName = kol?.name || "Unknown KOL";
    kolAvatarUrl = kol?.avatarUrl || null;

    // Try to get locked avatar URL
    try {
      const lockService = new IdentityLockService(supabase);
      const lock = await lockService.getLock(campaign.kolId);
      if (lock?.official_avatar_url) {
        kolAvatarUrl = lock.official_avatar_url;
      }
    } catch { /* ignore if table doesn't exist */ }

    scripts = await campaignService.getScripts(campaignId);
    scenes = await campaignService.getScenes(campaignId);
    prompts = await campaignService.getPrompts(campaignId);
  } catch (error) {
    loadError = formatError(error);
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
          <div className="font-medium text-red-400">Lỗi</div>
          <div className="text-sm text-gray-400 mt-1">{loadError.message}</div>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const activeScript = scripts.find((s) => s.is_active) || scripts[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/kol-admin/campaigns" className="text-xs text-gray-400 hover:text-white">
          ← Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold mt-1">{campaign.name}</h1>
        <p className="text-sm text-gray-500">
          KOL: {kolName} · Platform: {campaign.platform || "N/A"} · Status: {campaign.status}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="border border-white/10 rounded-lg p-3">
          <div className="text-xl font-bold">{scripts.length}</div>
          <div className="text-xs text-gray-400">Scripts</div>
        </div>
        <div className="border border-white/10 rounded-lg p-3">
          <div className="text-xl font-bold">{scenes.length}</div>
          <div className="text-xs text-gray-400">Scenes</div>
        </div>
        <div className="border border-white/10 rounded-lg p-3">
          <div className="text-xl font-bold">{prompts.length}</div>
          <div className="text-xs text-gray-400">Prompts</div>
        </div>
        <div className="border border-white/10 rounded-lg p-3">
          <div className="text-xl font-bold">{campaign.status}</div>
          <div className="text-xs text-gray-400">Status</div>
        </div>
      </div>

      {/* Campaign Studio: Images, Variants, Reference Sheets */}
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
      />
    </div>
  );
}
