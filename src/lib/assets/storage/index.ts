import "server-only";

import { SupabaseStorageProvider } from "@/lib/assets/storage/supabase-storage-provider";
import type { StorageProvider } from "@/lib/assets/storage/storage-provider";

const providers: Record<string, StorageProvider> = {
  supabase: new SupabaseStorageProvider(),
};

export function getAssetStorageProvider(name = process.env.ASSET_STORAGE_PROVIDER ?? "supabase") {
  const provider = providers[name];

  if (!provider) {
    throw new Error(`Unsupported asset storage provider: ${name}`);
  }

  return provider;
}

export function getAssetStorageBucket() {
  return process.env.ASSET_STORAGE_BUCKET ?? "project-assets";
}
