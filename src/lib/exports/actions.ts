"use server";

import { revalidatePath } from "next/cache";
import { requireUserProfile } from "@/lib/auth/server";
import { createVideoExport } from "@/lib/exports/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function startVideoExportAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const exportRatio = readString(formData, "exportRatio");
  const videoIds = formData
    .getAll("videoIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const subtitles = readString(formData, "subtitles");
  const voiceoverAssetId = readString(formData, "voiceoverAssetId");
  const musicAssetId = readString(formData, "musicAssetId");
  const logoAssetId = readString(formData, "logoAssetId");

  if (!projectId || !exportRatio || videoIds.length === 0) {
    throw new Error("Vui lòng cung cấp dự án, tỷ lệ export và ít nhất một clip.");
  }

  await createVideoExport({
    projectId,
    userId: user.id,
    videoIds,
    exportRatio,
    options: {
      subtitles: subtitles || undefined,
      voiceoverAssetId: voiceoverAssetId || undefined,
      musicAssetId: musicAssetId || undefined,
      logoAssetId: logoAssetId || undefined,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/render-history");
}
