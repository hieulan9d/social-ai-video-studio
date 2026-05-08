import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { ProjectAssetRecord } from "@/lib/assets/types";

const PROJECT_ASSET_SELECT =
  "id, project_id, user_id, asset_type, type, storage_provider, storage_bucket, storage_path, file_name, file_url, mime_type, file_size, width, height, metadata, prompt, model, output_url, status, created_at, updated_at";

function isMissingProjectAssetQuickSchemaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : "";
  const details = typeof record.details === "string" ? record.details : "";
  return (
    `${message} ${details}`.includes("project_assets") &&
    ["type", "prompt", "model", "output_url", "status"].some((column) =>
      `${message} ${details}`.includes(column),
    )
  );
}

export async function assertProjectOwnership(projectId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Khong tim thay du an hoac ban khong co quyen truy cap.");
  }
}

export async function saveGeneratedProjectAsset({
  userId,
  projectId,
  type,
  prompt,
  model,
  outputUrl,
  metadata,
}: {
  userId: string;
  projectId: string;
  type: "image" | "video";
  prompt: string;
  model: string;
  outputUrl: string;
  metadata?: Record<string, unknown>;
}) {
  await assertProjectOwnership(projectId, userId);

  const supabase = await createClient();
  const id = randomUUID();
  const { data, error } = await supabase
    .from("project_assets")
    .insert({
      id,
      project_id: projectId,
      user_id: userId,
      asset_type: type === "image" ? "generated_image" : "generated_video",
      type,
      storage_provider: "remote",
      storage_bucket: "9router",
      storage_path: `generated/${id}`,
      file_name: `${type}-${id}.${type === "image" ? "png" : "mp4"}`,
      file_url: outputUrl,
      output_url: outputUrl,
      mime_type: type === "image" ? "image/png" : "video/mp4",
      file_size: 0,
      prompt,
      model,
      status: "completed",
      metadata: metadata ?? {},
    })
    .select(PROJECT_ASSET_SELECT)
    .single<ProjectAssetRecord>();

  if (error) {
    if (isMissingProjectAssetQuickSchemaError(error)) {
      throw new Error(
        "Database cua ban chua cap nhat bang project_assets cho quick save. Can chay phan migration 0019_quick_ai_studio.sql de them cac cot type, prompt, model, output_url, status.",
      );
    }

    throw error;
  }

  return data;
}
