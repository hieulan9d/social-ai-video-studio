import "server-only";

import { randomUUID } from "node:crypto";
import { isAdminUserId } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { getAssetStorageBucket, getAssetStorageProvider } from "@/lib/assets/storage";
import type {
  ProjectAssetRecord,
  ProjectAssetType,
} from "@/lib/assets/types";
import { sanitizeFileName, validateAssetFile } from "@/lib/assets/validation";

const ASSET_SELECT =
  "id, project_id, user_id, asset_type, type, storage_provider, storage_bucket, storage_path, file_name, file_url, mime_type, file_size, width, height, metadata, prompt, model, output_url, status, created_at, updated_at";

function buildStoragePath({
  userId,
  projectId,
  assetType,
  fileName,
}: {
  userId: string;
  projectId: string;
  assetType: ProjectAssetType;
  fileName: string;
}) {
  return [
    "users",
    userId,
    "projects",
    projectId,
    "assets",
    `${assetType}-${randomUUID()}-${sanitizeFileName(fileName)}`,
  ].join("/");
}

async function assertProjectOwnership(projectId: string, userId: string) {
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
    throw new Error("Project not found.");
  }
}

async function attachSignedUrls(records: ProjectAssetRecord[]) {
  return Promise.all(
    records.map(async (record) => {
      if (record.storage_provider === "remote" || record.output_url) {
        return {
          ...record,
          file_url: record.output_url ?? record.file_url,
        };
      }

      try {
        const provider = getAssetStorageProvider(record.storage_provider);
        const signedUrl = await provider.createSignedReadUrl({
          bucket: record.storage_bucket,
          path: record.storage_path,
        });

        return {
          ...record,
          file_url: signedUrl,
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create signed asset url.";

        return {
          ...record,
          file_url: record.file_url,
          metadata: {
            ...record.metadata,
            signed_url_error: message,
          },
        };
      }
    }),
  );
}

export async function listProjectAssets(projectId: string, userId: string) {
  await assertProjectOwnership(projectId, userId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select(ASSET_SELECT)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<ProjectAssetRecord[]>();

  if (error) {
    throw error;
  }

  return attachSignedUrls(data);
}

export async function getProjectAsset({
  projectId,
  userId,
  assetId,
}: {
  projectId: string;
  userId: string;
  assetId: string;
}) {
  await assertProjectOwnership(projectId, userId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select(ASSET_SELECT)
    .eq("id", assetId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle<ProjectAssetRecord>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Asset not found.");
  }

  return (await attachSignedUrls([data]))[0];
}

export async function uploadProjectAsset({
  projectId,
  userId,
  assetType,
  file,
}: {
  projectId: string;
  userId: string;
  assetType: ProjectAssetType;
  file: File;
}) {
  validateAssetFile(file, assetType, {
    bypassSizeLimit: await isAdminUserId(userId),
  });
  await assertProjectOwnership(projectId, userId);

  const provider = getAssetStorageProvider();
  const bucket = getAssetStorageBucket();
  const storagePath = buildStoragePath({
    userId,
    projectId,
    assetType,
    fileName: file.name,
  });

  await provider.upload({
    bucket,
    path: storagePath,
    file,
    contentType: file.type,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_assets")
    .insert({
      project_id: projectId,
      user_id: userId,
      asset_type: assetType,
      storage_provider: provider.name,
      storage_bucket: bucket,
      storage_path: storagePath,
      file_name: file.name,
      file_url: null,
      mime_type: file.type,
      file_size: file.size,
      metadata: {
        original_file_name: file.name,
      },
    })
    .select(ASSET_SELECT)
    .single<ProjectAssetRecord>();

  if (error) {
    await provider.delete({
      bucket,
      path: storagePath,
    });

    throw error;
  }

  return (await attachSignedUrls([data]))[0];
}

export async function deleteProjectAsset({
  projectId,
  userId,
  assetId,
}: {
  projectId: string;
  userId: string;
  assetId: string;
}) {
  await assertProjectOwnership(projectId, userId);

  const supabase = await createClient();
  const { data: asset, error: fetchError } = await supabase
    .from("project_assets")
    .select(ASSET_SELECT)
    .eq("id", assetId)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle<ProjectAssetRecord>();

  if (fetchError) {
    throw fetchError;
  }

  if (!asset) {
    throw new Error("Asset not found.");
  }

  if (asset.storage_provider !== "remote") {
    const provider = getAssetStorageProvider(asset.storage_provider);
    await provider.delete({
      bucket: asset.storage_bucket,
      path: asset.storage_path,
    });
  }

  const { error: deleteError } = await supabase
    .from("project_assets")
    .delete()
    .eq("id", assetId)
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }
}
