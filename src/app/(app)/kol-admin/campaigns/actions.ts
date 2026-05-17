"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CampaignService } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";

export async function createCampaignAction(formData: FormData) {
  const kolId = String(formData.get("kolId") || "").trim();
  const workspaceId = String(formData.get("workspaceId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const platform = String(formData.get("platform") || "").trim();
  const contentType = String(formData.get("content_type") || "").trim();
  const campaignGoal = String(formData.get("campaign_goal") || "").trim();

  if (!kolId || !workspaceId || !name) return;

  const user = await requireUserProfile();
  const supabase = await createClient();
  const service = new CampaignService(supabase);

  await service.createCampaign(user.id, {
    kol_id: kolId,
    workspace_id: workspaceId,
    name,
    platform: platform || undefined,
    content_type: contentType || undefined,
    campaign_goal: campaignGoal || undefined,
  });

  revalidatePath("/kol-admin/campaigns");
}
