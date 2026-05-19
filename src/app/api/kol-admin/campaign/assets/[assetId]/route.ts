import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth/server";

/**
 * DELETE /api/kol-admin/campaign/assets/[assetId]
 * Soft-delete a campaign asset.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { assetId } = await params;
    if (!assetId) {
      return NextResponse.json({ error: "assetId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("kol_campaign_assets")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", assetId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
