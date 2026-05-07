"use server";

import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboardingAction(formData: FormData) {
  const user = await requireUserProfile();
  const supabase = await createClient();

  const goals = formData.getAll("goals").filter((value): value is string => {
    return typeof value === "string" && value.length > 0;
  });
  const workspaceRole = formData.get("workspaceRole");

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_metadata: {
        goals: goals.slice(0, 6),
        workspaceRole: typeof workspaceRole === "string" ? workspaceRole : null,
      },
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }

  redirect("/projects/new");
}
