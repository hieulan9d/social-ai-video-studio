import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type QuickGenerationType = "image" | "video" | "prompt";

export type QuickGenerationRecord = {
  id: string;
  user_id: string;
  type: QuickGenerationType;
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

type CreateQuickGenerationInput = {
  userId: string;
  type: QuickGenerationType;
  prompt: string;
  model: string;
  outputUrl?: string | null;
  status?: QuickGenerationRecord["status"];
  aspectRatio?: string | null;
  durationSeconds?: number | null;
  quantity?: number;
  referenceFileName?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
};

const QUICK_GENERATION_SELECT =
  "id, user_id, type, prompt, model, output_url, status, aspect_ratio, duration_seconds, quantity, reference_file_name, error_message, metadata, created_at, updated_at";

function isCancelledQueryError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "57014"
  );
}

function isMissingQuickGenerationsTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : "";
  const details = typeof record.details === "string" ? record.details : "";
  return `${message} ${details}`.includes("public.quick_generations");
}

export const isQuickGenerationHistoryAvailable = cache(async () => {
  const supabase = await createClient();
  const { error } = await supabase.from("quick_generations").select("id").limit(1);

  if (error) {
    if (isCancelledQueryError(error)) {
      return false;
    }

    if (isMissingQuickGenerationsTableError(error)) {
      return false;
    }

    throw error;
  }

  return true;
});

export const listQuickGenerations = cache(async ({
  userId,
  type,
  limit = 30,
}: {
  userId: string;
  type?: QuickGenerationType;
  limit?: number;
}) => {
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
    if (isCancelledQueryError(error)) {
      return [];
    }

    if (isMissingQuickGenerationsTableError(error)) {
      return [];
    }

    throw error;
  }

  return data;
});

export async function createQuickGeneration(input: CreateQuickGenerationInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quick_generations")
    .insert({
      user_id: input.userId,
      type: input.type,
      prompt: input.prompt,
      model: input.model,
      output_url: input.outputUrl ?? null,
      status: input.status ?? "completed",
      aspect_ratio: input.aspectRatio ?? null,
      duration_seconds: input.durationSeconds ?? null,
      quantity: Math.max(1, Math.trunc(input.quantity ?? 1)),
      reference_file_name: input.referenceFileName ?? null,
      error_message: input.errorMessage ?? null,
      metadata: input.metadata ?? {},
    })
    .select(QUICK_GENERATION_SELECT)
    .single<QuickGenerationRecord>();

  if (error) {
    if (isMissingQuickGenerationsTableError(error)) {
      return null;
    }

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
