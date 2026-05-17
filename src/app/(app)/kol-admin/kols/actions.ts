"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { KolService } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";

export async function deleteKolAction(kolId: string) {
  if (!kolId) return;

  const user = await requireUserProfile();
  const supabase = await createClient();
  const service = new KolService(supabase);

  await service.deleteKol(kolId, user.id);

  revalidatePath("/kol-admin/kols");
}
