import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { IdentityLockService, CampaignService, AvatarStorageService } from "@/modules/ai-kol-system";
import { GeminiImageProvider } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/campaign/generate-reference-sheet
 *
 * Generate a multi-angle 8-panel character reference sheet
 * using the fixed prompt template + KOL identity lock.
 *
 * This is the final step after user has finalized the KOL look
 * for this campaign (outfit, hair, etc.)
 */

const REFERENCE_SHEET_PROMPT = `Create a professional multi-angle character reference sheet for the SAME person from the provided reference image.

Maintain exact facial identity from reference.
Maintain exact hairstyle.
Maintain exact skin tone.
Maintain exact body proportions.
Maintain exact age appearance.
Maintain exact ethnicity.
Maintain exact facial structure.
Maintain exact clothing style unless specified otherwise.

Layout:
8-panel grid layout
clean white studio background
thin black divider lines between each panel
minimal passport-style reference sheet layout

Top row (full body views):
1. front full body
2. left side full body
3. right side full body
4. back full body

Bottom row (portrait close-up views):
5. front face close-up
6. left profile close-up
7. right profile close-up
8. back head close-up

Requirements:
all 8 panels must show the exact same person
high facial consistency across every angle
accurate body consistency
same outfit in every frame
same hairstyle in every frame
neutral standing pose
natural facial expression
slight relaxed smile
arms naturally placed beside body

Photography style:
ultra realistic
studio lighting
white seamless backdrop
sharp details
clean shadows
high-resolution
identity dataset photography
training reference sheet style

Camera:
eye-level camera
center framing
symmetrical composition
consistent distance

Important:
do not change identity
do not beautify face excessively
do not stylize character
do not add accessories unless present in reference
do not generate different faces in different panels`;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const { campaignId, kolId, variantImageUrl, additionalInstructions } = body;

    if (!campaignId || !kolId) {
      return NextResponse.json(
        { error: "campaignId, kolId required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get identity lock
    const lockService = new IdentityLockService(supabase);
    const lock = await lockService.getLock(kolId);

    // Determine which image to use as reference
    const referenceUrl = variantImageUrl || lock?.official_avatar_url;
    if (!referenceUrl) {
      return NextResponse.json(
        { error: "No reference image available. Finalize KOL avatar first or provide a variant image." },
        { status: 400 }
      );
    }

    // Build final prompt
    let finalPrompt = REFERENCE_SHEET_PROMPT;
    if (additionalInstructions) {
      finalPrompt += `\n\nAdditional instructions:\n${additionalInstructions}`;
    }

    // Call provider
    const provider = new GeminiImageProvider();
    const result = await provider.generate({
      prompt: finalPrompt,
      candidateCount: 1,
      referenceImages: [{ url: referenceUrl, role: "face" }],
      parentImageUrl: referenceUrl,
      settings: {
        aspect_ratio: "1:1",
        size: "1024x1024",
      },
    });

    if (result.outputUrls.length === 0) {
      return NextResponse.json({ error: "No output generated" }, { status: 500 });
    }

    // Store the reference sheet
    const storage = new AvatarStorageService();
    const path = `campaigns/${user.id}/${campaignId}/reference-sheets/${Date.now()}_ref_sheet.png`;
    const stored = await storage.fetchAndStore({
      sourceUrl: result.outputUrls[0],
      path,
    });

    // Save as campaign asset
    const campaignService = new CampaignService(supabase);
    const asset = await campaignService.createAsset({
      campaign_id: campaignId,
      kol_id: kolId,
      asset_type: "reference_image",
      name: "Character Reference Sheet (8-panel)",
      file_url: stored.publicUrl,
      metadata: {
        type: "reference_sheet",
        panels: 8,
        source_image: referenceUrl,
        additional_instructions: additionalInstructions || null,
        generation_time_ms: result.generationTimeMs,
        model: result.model,
      },
    });

    return NextResponse.json({
      referenceSheetUrl: stored.publicUrl,
      asset,
      generationTimeMs: result.generationTimeMs,
    });
  } catch (error) {
    console.error("[generate-reference-sheet]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
