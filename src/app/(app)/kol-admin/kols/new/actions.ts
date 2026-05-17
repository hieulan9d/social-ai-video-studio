"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KolService, KolDnaService, formatError } from "@/modules/ai-kol-system";
import { requireUserProfile } from "@/lib/auth/server";

export async function createKolAction(formData: FormData) {
  const workspace_id = String(formData.get("workspace_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim();

  if (!workspace_id || !name) {
    throw new Error("workspace_id and name are required");
  }

  const user = await requireUserProfile();
  const supabase = await createClient();
  const kolService = new KolService(supabase);

  let kol;
  try {
    kol = await kolService.createKol(user.id, {
      workspace_id,
      name,
      slug: slug || undefined,
    });
  } catch (error) {
    const formatted = formatError(error);

    // If slug duplicate, retry with timestamped slug
    if (formatted.code === "23505" && formatted.message.includes("slug")) {
      try {
        kol = await kolService.createKol(user.id, {
          workspace_id,
          name,
          slug: `${slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        });
      } catch (retryError) {
        const retryFormatted = formatError(retryError);
        throw new Error(
          `Failed to create KOL: ${retryFormatted.message}${retryFormatted.code ? ` (${retryFormatted.code})` : ""}`
        );
      }
    } else {
      throw new Error(
        `Failed to create KOL: ${formatted.message}${formatted.code ? ` (${formatted.code})` : ""}${
          formatted.code === "42501"
            ? " — RLS policy missing. Run migration 002_rls_policies.sql"
            : ""
        }`
      );
    }
  }

  // Create identity DNA if any DNA fields provided
  const gender = String(formData.get("gender") || "").trim();
  const age_appearance = String(formData.get("age_appearance") || "").trim();
  const ethnicity = String(formData.get("ethnicity") || "").trim();
  const hairstyle = String(formData.get("hairstyle") || "").trim();

  if (gender || age_appearance || ethnicity || hairstyle) {
    try {
      const dnaService = new KolDnaService(supabase);
      await dnaService.upsertIdentityDna(kol.id, {
        gender: gender || undefined,
        age_appearance: age_appearance || undefined,
        ethnicity: ethnicity || undefined,
        hairstyle: hairstyle || undefined,
      });
    } catch (error) {
      const formatted = formatError(error);
      throw new Error(`KOL created but failed to save DNA: ${formatted.message}`);
    }
  }

  redirect(`/kol-admin/kols/${kol.id}/avatar`);
}
