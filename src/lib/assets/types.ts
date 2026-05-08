export const PROJECT_ASSET_TYPES = [
  "product_image",
  "start_image",
  "end_image",
  "avatar_image",
  "logo",
  "background_image",
  "voiceover_audio",
  "music_audio",
] as const;

export type ProjectAssetType = (typeof PROJECT_ASSET_TYPES)[number];
export type GeneratedProjectAssetType = "generated_image" | "generated_video";
export type StoredProjectAssetType =
  | ProjectAssetType
  | "reference_image"
  | "audio"
  | GeneratedProjectAssetType;

export type ProjectAssetRecord = {
  id: string;
  project_id: string;
  user_id: string;
  asset_type: StoredProjectAssetType;
  type?: "image" | "video" | "audio" | "file";
  storage_provider: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  file_url: string | null;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  prompt?: string | null;
  model?: string | null;
  output_url?: string | null;
  status?: "queued" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
};

export type ProjectAsset = {
  id: string;
  projectId: string;
  userId: string;
  assetType: ProjectAssetType;
  storageProvider: string;
  storageBucket: string;
  storagePath: string;
  fileName: string;
  fileUrl: string | null;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export function isProjectAssetType(value: string): value is ProjectAssetType {
  return PROJECT_ASSET_TYPES.includes(value as ProjectAssetType);
}
