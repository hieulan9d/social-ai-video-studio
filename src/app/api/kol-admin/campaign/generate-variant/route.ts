import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { IdentityLockService, CampaignService, AvatarStorageService } from "@/modules/ai-kol-system";
import { getDefaultAvatarProvider } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/campaign/generate-variant
 *
 * Generate a KOL variant image for a campaign:
 * - Change outfit
 * - Change hairstyle
 * - Change background
 * - Add product in hand
 * - etc.
 *
 * Uses the locked KOL avatar as the identity reference.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const { campaignId, kolId, prompt, referenceImageUrls } = body;

    if (!campaignId || !kolId || !prompt) {
      return NextResponse.json(
        { error: "campaignId, kolId, prompt required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the locked KOL avatar as identity reference
    const lockService = new IdentityLockService(supabase);
    const lock = await lockService.getLock(kolId);

    // Build reference images array
    const refs: { url: string; role: "face" | "style" | "general" }[] = [];

    // Always include official avatar as face reference
    if (lock?.official_avatar_url) {
      refs.push({ url: lock.official_avatar_url, role: "face" });
    }

    // Add any additional reference images from the request
    if (Array.isArray(referenceImageUrls)) {
      for (const url of referenceImageUrls) {
        if (typeof url === "string" && url.trim()) {
          refs.push({ url: url.trim(), role: "style" });
        }
      }
    }

    // Build enhanced prompt with identity preservation
    const enhancedPrompt = buildVariantPrompt(prompt, lock);

    // Call provider
    const provider = getDefaultAvatarProvider();
    const result = await provider.generate({
      prompt: enhancedPrompt,
      candidateCount: body.candidateCount || 2,
      referenceImages: refs,
      parentImageUrl: lock?.official_avatar_url,
      settings: body.settings,
    });

    // Store outputs
    const storage = new AvatarStorageService();
    const storedUrls: string[] = [];

    for (let i = 0; i < result.outputUrls.length; i++) {
      const path = `campaigns/${user.id}/${campaignId}/variants/${Date.now()}_v${i}.png`;
      const stored = await storage.fetchAndStore({
        sourceUrl: result.outputUrls[i],
        path,
      });
      storedUrls.push(stored.publicUrl);
    }

    // Save selected variant as campaign asset
    const campaignService = new CampaignService(supabase);
    const assets = [];
    for (let i = 0; i < storedUrls.length; i++) {
      const asset = await campaignService.createAsset({
        campaign_id: campaignId,
        kol_id: kolId,
        asset_type: "reference_image",
        name: `KOL Variant ${i + 1}`,
        file_url: storedUrls[i],
        metadata: {
          prompt,
          enhanced_prompt: enhancedPrompt,
          generation_time_ms: result.generationTimeMs,
          model: result.model,
        },
      });
      assets.push(asset);
    }

    return NextResponse.json({
      outputUrls: storedUrls,
      assets,
      generationTimeMs: result.generationTimeMs,
    });
  } catch (error) {
    console.error("[generate-variant]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function buildVariantPrompt(
  userPrompt: string,
  lock: Awaited<ReturnType<IdentityLockService["getLock"]>>
): string {
  const parts: string[] = [userPrompt.trim()];

  parts.push("");
  parts.push("IDENTITY PRESERVATION RULES:");
  parts.push("- Maintain exact facial identity from reference");
  parts.push("- Maintain exact skin tone");
  parts.push("- Maintain exact body proportions");
  parts.push("- Maintain exact age appearance");
  parts.push("- Maintain exact ethnicity");
  parts.push("- Maintain exact facial structure");
  parts.push("- Do not change identity");
  parts.push("- Do not beautify face excessively");

  if (lock?.visual_anchor && typeof lock.visual_anchor === "object") {
    parts.push("");
    parts.push("VISUAL ANCHOR:");
    const anchor = lock.visual_anchor as Record<string, unknown>;
    for (const [key, value] of Object.entries(anchor)) {
      if (value && typeof value === "string") {
        parts.push(`- ${key}: ${value}`);
      }
    }
  }

  parts.push("");
  parts.push("Photography style: ultra realistic, studio lighting, sharp details, high-resolution");

  return parts.join("\n");
}
