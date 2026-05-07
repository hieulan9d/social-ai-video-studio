import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  UploadBlobInput,
  StorageProvider,
  UploadAssetInput,
} from "@/lib/assets/storage/storage-provider";

export class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase";

  async upload(input: UploadAssetInput) {
    await this.uploadBlob({
      bucket: input.bucket,
      path: input.path,
      data: input.file,
      contentType: input.contentType,
    });
  }

  async uploadBlob(input: UploadBlobInput) {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(input.bucket)
      .upload(input.path, input.data, {
        contentType: input.contentType,
        upsert: false,
      });

    if (error) {
      throw error;
    }
  }

  async delete(input: { bucket: string; path: string }) {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(input.bucket)
      .remove([input.path]);

    if (error) {
      throw error;
    }
  }

  async downloadBlob(input: { bucket: string; path: string }) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .download(input.path);

    if (error) {
      throw error;
    }

    return data;
  }

  async createSignedReadUrl(input: {
    bucket: string;
    path: string;
    expiresInSeconds?: number;
  }) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .createSignedUrl(input.path, input.expiresInSeconds ?? 60 * 10);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  }
}
