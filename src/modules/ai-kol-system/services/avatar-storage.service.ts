import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const AVATAR_BUCKET = "kol-avatars";

/**
 * Storage service for avatar reference images and generated outputs.
 * Uses Supabase Storage admin client to bypass RLS for server-side uploads.
 */
export class AvatarStorageService {
  readonly bucket = AVATAR_BUCKET;

  /**
   * Upload a Blob to the avatar bucket.
   */
  async uploadBlob(input: {
    path: string;
    data: Blob;
    contentType: string;
  }): Promise<{ path: string; publicUrl: string }> {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(input.path, input.data, {
        contentType: input.contentType,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(input.path);

    return {
      path: input.path,
      publicUrl: urlData.publicUrl,
    };
  }

  /**
   * Upload a File from a FormData submission.
   */
  async uploadFile(input: {
    path: string;
    file: File;
  }): Promise<{ path: string; publicUrl: string; size: number; mimeType: string }> {
    const supabase = createAdminClient();
    const arrayBuffer = await input.file.arrayBuffer();

    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(input.path, arrayBuffer, {
        contentType: input.file.type,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(input.path);

    return {
      path: input.path,
      publicUrl: urlData.publicUrl,
      size: input.file.size,
      mimeType: input.file.type,
    };
  }

  /**
   * Download a remote URL and persist it to the bucket.
   */
  async fetchAndStore(input: {
    sourceUrl: string;
    path: string;
  }): Promise<{ path: string; publicUrl: string; mimeType: string; size: number }> {
    let blob: Blob;
    let mimeType: string;

    if (input.sourceUrl.startsWith("data:")) {
      // Handle data URLs directly
      const match = input.sourceUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) throw new Error("Invalid data URL");
      mimeType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    } else {
      const response = await fetch(input.sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${input.sourceUrl}: ${response.status}`);
      }
      blob = await response.blob();
      mimeType = blob.type || "image/png";
    }

    const result = await this.uploadBlob({
      path: input.path,
      data: blob,
      contentType: mimeType,
    });

    return { ...result, mimeType, size: blob.size };
  }

  /**
   * Build a unique storage path for an avatar asset.
   */
  buildPath(parts: {
    userId: string;
    kolId: string;
    sessionId: string;
    kind: 'reference' | 'generation' | 'official';
    fileName: string;
  }): string {
    const safeName = parts.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${parts.userId}/${parts.kolId}/${parts.sessionId}/${parts.kind}/${Date.now()}_${safeName}`;
  }

  /**
   * Build the public URL for a stored object.
   */
  getPublicUrl(path: string): string {
    const supabase = createAdminClient();
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Delete a stored object.
   */
  async delete(path: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    if (error) throw error;
  }
}
