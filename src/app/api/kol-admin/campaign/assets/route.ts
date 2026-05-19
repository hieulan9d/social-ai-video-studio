import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { CampaignService } from "@/modules/ai-kol-system";
import { AvatarStorageService } from "@/modules/ai-kol-system";
import type { CampaignAssetType } from "@/modules/ai-kol-system";

/**
 * POST /api/kol-admin/campaign/assets
 *   Upload campaign asset (product image, KOL variant, etc.)
 *
 * GET /api/kol-admin/campaign/assets?campaignId=xxx
 *   List campaign assets
 */

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const formData = await req.formData();

    const campaignId = String(formData.get("campaignId") || "");
    const kolId = String(formData.get("kolId") || "");
    const assetType = String(formData.get("assetType") || "product_image") as CampaignAssetType;
    const name = String(formData.get("name") || "");
    const file = formData.get("file");

    if (!campaignId || !kolId || !(file instanceof File)) {
      return NextResponse.json({ error: "campaignId, kolId, file required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "file must be an image" }, { status: 400 });
    }

    // Upload to storage
    const storage = new AvatarStorageService();
    const path = `campaigns/${user.id}/${campaignId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const stored = await storage.uploadFile({ path, file });

    // Save to DB
    const supabase = await createClient();
    const service = new CampaignService(supabase);
    const asset = await service.createAsset({
      campaign_id: campaignId,
      kol_id: kolId,
      asset_type: assetType,
      name: name || file.name,
      file_url: stored.publicUrl,
      storage_path: stored.path,
      mime_type: stored.mimeType,
      file_size: stored.size,
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error("[campaign/assets POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const campaignId = req.nextUrl.searchParams.get("campaignId");
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const service = new CampaignService(supabase);
    const assets = await service.getAssets(campaignId);

    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
