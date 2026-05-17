"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceService } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";

export async function createWorkspaceAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) return;

  const user = await requireUserProfile();
  const supabase = await createClient();
  const service = new WorkspaceService(supabase);

  await service.createWorkspace(user.id, {
    name,
    description: description || undefined,
  });

  revalidatePath("/kol-admin/workspaces");
}
