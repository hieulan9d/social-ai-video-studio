import {
  isProjectAssetType,
  PROJECT_ASSET_TYPES,
  type ProjectAssetType,
} from "@/lib/assets/types";

export const MAX_PROJECT_IMAGE_ASSET_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_PROJECT_AUDIO_ASSET_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_PROJECT_ASSET_SIZE_BYTES = MAX_PROJECT_AUDIO_ASSET_SIZE_BYTES;

export const ALLOWED_PROJECT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_PROJECT_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
] as const;

export const ALLOWED_PROJECT_ASSET_MIME_TYPES = [
  ...ALLOWED_PROJECT_IMAGE_MIME_TYPES,
  ...ALLOWED_PROJECT_AUDIO_MIME_TYPES,
] as const;

export function validateAssetType(value: string): ProjectAssetType {
  if (!isProjectAssetType(value)) {
    throw new Error(
      `Asset type must be one of: ${PROJECT_ASSET_TYPES.join(", ")}.`,
    );
  }

  return value;
}

export function validateAssetFile(
  file: File,
  assetType?: ProjectAssetType,
  options?: { bypassSizeLimit?: boolean },
) {
  if (file.size <= 0) {
    throw new Error("Uploaded file is empty.");
  }

  if (assetType?.endsWith("_audio") && !file.type.startsWith("audio/")) {
    throw new Error("This asset slot requires an audio file.");
  }

  if (assetType && !assetType.endsWith("_audio") && !file.type.startsWith("image/")) {
    throw new Error("This asset slot requires an image file.");
  }

  if (
    ALLOWED_PROJECT_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PROJECT_IMAGE_MIME_TYPES)[number],
    )
  ) {
    if (!options?.bypassSizeLimit && file.size > MAX_PROJECT_IMAGE_ASSET_SIZE_BYTES) {
      throw new Error("Uploaded image must be 10MB or smaller.");
    }
    return;
  }

  if (
    ALLOWED_PROJECT_AUDIO_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PROJECT_AUDIO_MIME_TYPES)[number],
    )
  ) {
    if (!options?.bypassSizeLimit && file.size > MAX_PROJECT_AUDIO_ASSET_SIZE_BYTES) {
      throw new Error("Uploaded audio must be 50MB or smaller.");
    }
    return;
  }

  throw new Error("Uploaded file must be an image or supported audio file.");
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const safe = normalized.replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-");

  return safe || "asset";
}
