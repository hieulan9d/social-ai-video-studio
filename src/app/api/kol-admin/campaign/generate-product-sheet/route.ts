import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { CampaignService, AvatarStorageService } from "@/modules/ai-kol-system";
import { GeminiImageProvider } from "@/modules/ai-kol-system/providers/gemini";

/**
 * POST /api/kol-admin/campaign/generate-product-sheet
 *
 * Generate a multi-angle product reference sheet (8 panels)
 * using the fixed prompt template for product identity preservation.
 */

const PRODUCT_SHEET_PROMPT = `Create a professional multi-angle product reference sheet from the provided product reference image.

IDENTITY LOCK:
- Preserve exact product design
- Preserve exact packaging shape
- Preserve exact label layout
- Preserve exact logo
- Preserve exact brand name
- Preserve exact colors
- Preserve exact text on packaging
- Preserve exact material texture
- Do NOT redesign the product

LAYOUT:
- Multi-angle reference sheet
- Pure white seamless studio background
- Clean grid layout with thin light gray divider lines
- Minimal product dataset reference sheet
- 8 panels

VIEWS:
Panel 1: Front view — product facing directly forward, label fully visible, centered
Panel 2: Left 45 degree angle — product rotated slightly left, packaging shape clearly visible
Panel 3: Right 45 degree angle — product rotated slightly right, packaging depth visible
Panel 4: Left side view — 90 degree left side, accurate thickness and silhouette
Panel 5: Right side view — 90 degree right side, accurate thickness and silhouette
Panel 6: Back view — back packaging view, preserve details if visible
Panel 7: Top view — top-down product view, cap/box top clearly visible
Panel 8: Close-up detail — sharp close-up of logo, label, texture, key packaging details

PHOTOGRAPHY STYLE:
- Ultra realistic commercial product photography
- Soft studio lighting
- Natural soft shadow under product
- Extremely sharp label and edges
- High resolution, 8k detail
- Clean white studio surface

PURPOSE: This image will be used as a product identity reference for AI video generation. Product must remain consistent across future video scenes. Label must stay readable. Packaging must not morph. Brand identity must remain unchanged.

NEGATIVE: wrong logo, wrong brand name, changed packaging, distorted label, unreadable text, fake text, new design, different product, extra product, missing cap, warped box, blurry label, low resolution, messy background, cartoon, CGI look, overly stylized, dramatic lighting, random accessories`;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { campaignId, kolId, productImageUrl } = body;

    if (!campaignId || !kolId || !productImageUrl) {
      return NextResponse.json(
        { error: "campaignId, kolId, productImageUrl required" },
        { status: 400 }
      );
    }

    // Call Gemini with product image as reference
    const provider = new GeminiImageProvider();
    const result = await provider.generate({
      prompt: PRODUCT_SHEET_PROMPT,
      candidateCount: 1,
      referenceImages: [{ url: productImageUrl, role: "general" }],
      parentImageUrl: productImageUrl,
      settings: { aspect_ratio: "1:1" },
    });

    if (result.outputUrls.length === 0) {
      return NextResponse.json({ error: "No output generated" }, { status: 500 });
    }

    // Store the product reference sheet
    const storage = new AvatarStorageService();
    const path = `campaigns/${user.id}/${campaignId}/product-sheets/${Date.now()}_product_ref.png`;
    const stored = await storage.fetchAndStore({
      sourceUrl: result.outputUrls[0],
      path,
    });

    // Save as campaign asset
    const supabase = await createClient();
    const campaignService = new CampaignService(supabase);
    const asset = await campaignService.createAsset({
      campaign_id: campaignId,
      kol_id: kolId,
      asset_type: "product_image",
      name: "Product Reference Sheet (8-panel)",
      file_url: stored.publicUrl,
      metadata: {
        type: "product_reference_sheet",
        panels: 8,
        source_image: productImageUrl,
        generation_time_ms: result.generationTimeMs,
        model: result.model,
      },
    });

    return NextResponse.json({
      productSheetUrl: stored.publicUrl,
      asset,
      generationTimeMs: result.generationTimeMs,
    });
  } catch (error) {
    console.error("[generate-product-sheet]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
