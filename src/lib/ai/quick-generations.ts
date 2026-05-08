import "server-only";

import { createClient } from "@/lib/supabase/server";

export type QuickGenerationRecord = {
  id: string;
  user_id: string;
  type: "image" | "video";
  prompt: string;
  model: string;
  output_url: string | null;
  status: "queued" | "processing" | "completed" | "failed";
  aspect_ratio: string | null;
  duration_seconds: number | null;
  quantity: number;
  reference_file_name: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

const QUICK_GENERATION_SELECT =
  "id, user_id, type, prompt, model, output_url, status, aspect_ratio, duration_seconds, quantity, reference_file_name, error_message, metadata, created_at, updated_at";

export async function listQuickGenerations({
  userId,
  type,
  limit = 30,
}: {
  userId: string;
  type?: "image" | "video";
  limit?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("quick_generations")
    .select(QUICK_GENERATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query.returns<QuickGenerationRecord[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteQuickGeneration({
  userId,
  generationId,
}: {
  userId: string;
  generationId: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quick_generations")
    .delete()
    .eq("id", generationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function getQuickGeneration({
  userId,
  generationId,
}: {
  userId: string;
  generationId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quick_generations")
    .select(QUICK_GENERATION_SELECT)
    .eq("id", generationId)
    .eq("user_id", userId)
    .maybeSingle<QuickGenerationRecord>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Không tìm thấy lịch sử tạo nhanh.");
  }

  return data;
}
