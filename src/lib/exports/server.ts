import "server-only";

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getProjectAsset } from "@/lib/assets/server";
import { getAssetStorageProvider } from "@/lib/assets/storage";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { getProjectById, updateProject } from "@/lib/projects/server";
import type {
  ExportJobRecord,
  GeneratedVideoRecord,
} from "@/lib/projects/types";
import { createClient } from "@/lib/supabase/server";
import { deductCredits, getUserWallet, refundCredits } from "@/lib/wallet/server";

const EXPORT_RATIOS = ["9:16", "1:1", "16:9"] as const;
type ExportRatio = (typeof EXPORT_RATIOS)[number];

const EXPORT_JOB_SELECT =
  "id, project_id, user_id, status, export_ratio, credit_cost, input_video_ids, options, output_storage_provider, output_storage_bucket, output_storage_path, output_mime_type, error_message, started_at, completed_at, metadata, created_at, updated_at";

const GENERATED_VIDEO_SELECT =
  "id, project_id, user_id, render_job_id, file_url, thumbnail_url, duration_seconds, status, provider, provider_job_id, storage_provider, storage_bucket, storage_path, mime_type, metadata, created_at, updated_at";

type ExportOptions = {
  subtitles?: string;
  voiceoverAssetId?: string;
  musicAssetId?: string;
  logoAssetId?: string;
};

function getGeneratedVideoBucket() {
  return process.env.GENERATED_VIDEO_STORAGE_BUCKET ?? "generated-videos";
}

function getFfmpegPath() {
  return process.env.FFMPEG_PATH?.trim() || "ffmpeg";
}

function isExportRatio(value: string): value is ExportRatio {
  return EXPORT_RATIOS.includes(value as ExportRatio);
}

function ratioDimensions(ratio: ExportRatio) {
  if (ratio === "16:9") return { width: 1920, height: 1080 };
  if (ratio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function buildExportPath({
  userId,
  projectId,
  exportJobId,
}: {
  userId: string;
  projectId: string;
  exportJobId: string;
}) {
  return [
    "users",
    userId,
    "projects",
    projectId,
    "exports",
    `${exportJobId}-${randomUUID()}.mp4`,
  ].join("/");
}

function getMetadataFlag(metadata: Record<string, unknown>, key: string) {
  return metadata[key] === true;
}

function escapeConcatPath(path: string) {
  return path.replaceAll("\\", "/").replaceAll("'", "'\\''");
}

function escapeDrawText(text: string) {
  return text
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll(",", "\\,")
    .replaceAll("%", "\\%");
}

async function blobToFile(blob: Blob, path: string) {
  await writeFile(path, Buffer.from(await blob.arrayBuffer()));
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(getFfmpegPath(), args, {
      windowsHide: true,
    });
    const stderr: string[] = [];

    child.stderr.on("data", (chunk) => {
      stderr.push(String(chunk));
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `FFmpeg failed with exit code ${code}: ${stderr.join("").slice(-2000)}`,
        ),
      );
    });
  });
}

async function updateExportJob(
  exportJobId: string,
  userId: string,
  payload: Record<string, unknown>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("export_jobs")
    .update(payload)
    .eq("id", exportJobId)
    .eq("user_id", userId)
    .select(EXPORT_JOB_SELECT)
    .single<ExportJobRecord>();

  if (error) {
    throw error;
  }

  return data;
}

async function getOwnedExportJob(exportJobId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("export_jobs")
    .select(EXPORT_JOB_SELECT)
    .eq("id", exportJobId)
    .eq("user_id", userId)
    .maybeSingle<ExportJobRecord>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Export job not found.");
  }

  return data;
}

async function refundExportCredits(job: ExportJobRecord, reason: string) {
  if (job.credit_cost <= 0 || getMetadataFlag(job.metadata, "refunded")) {
    return;
  }

  await refundCredits({
    userId: job.user_id,
    amount: job.credit_cost,
    reason,
    referenceType: "video_export_refund",
    referenceId: job.id,
    metadata: {
      project_id: job.project_id,
      export_job_id: job.id,
    },
  });

  await updateExportJob(job.id, job.user_id, {
    metadata: {
      ...job.metadata,
      refunded: true,
    },
  });
}

async function getOwnedGeneratedVideos({
  projectId,
  userId,
  videoIds,
}: {
  projectId: string;
  userId: string;
  videoIds: string[];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_videos")
    .select(GENERATED_VIDEO_SELECT)
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .in("id", videoIds)
    .returns<GeneratedVideoRecord[]>();

  if (error) {
    throw error;
  }

  const byId = new Map(data.map((video) => [video.id, video]));
  return videoIds.map((id) => {
    const video = byId.get(id);

    if (!video) {
      throw new Error("One or more selected clips were not found.");
    }

    if (!video.storage_provider || !video.storage_bucket || !video.storage_path) {
      throw new Error("Selected clips must be stored videos.");
    }

    return video;
  });
}

async function maybeDownloadAudioAsset({
  projectId,
  userId,
  assetId,
  outputPath,
}: {
  projectId: string;
  userId: string;
  assetId?: string;
  outputPath: string;
}) {
  if (!assetId) return null;

  const asset = await getProjectAsset({ projectId, userId, assetId });

  if (!asset.mime_type.startsWith("audio/")) {
    throw new Error("Selected voiceover or music asset must be audio.");
  }

  const provider = getAssetStorageProvider(asset.storage_provider);
  const blob = await provider.downloadBlob({
    bucket: asset.storage_bucket,
    path: asset.storage_path,
  });
  await blobToFile(blob, outputPath);

  return outputPath;
}

async function maybeDownloadLogoAsset({
  projectId,
  userId,
  assetId,
  outputPath,
}: {
  projectId: string;
  userId: string;
  assetId?: string;
  outputPath: string;
}) {
  if (!assetId) return null;

  const asset = await getProjectAsset({ projectId, userId, assetId });

  if (!asset.mime_type.startsWith("image/")) {
    throw new Error("Selected watermark/logo asset must be an image.");
  }

  const provider = getAssetStorageProvider(asset.storage_provider);
  const blob = await provider.downloadBlob({
    bucket: asset.storage_bucket,
    path: asset.storage_path,
  });
  await blobToFile(blob, outputPath);

  return outputPath;
}

async function renderWithFfmpeg({
  job,
  clips,
  options,
}: {
  job: ExportJobRecord;
  clips: GeneratedVideoRecord[];
  options: ExportOptions;
}) {
  const workDir = join(/*turbopackIgnore: true*/ process.cwd(), ".tmp", "exports", job.id);
  await mkdir(workDir, { recursive: true });

  try {
    const { width, height } = ratioDimensions(job.export_ratio);
    const normalizedPaths: string[] = [];

    for (const [index, clip] of clips.entries()) {
      const provider = getAssetStorageProvider(clip.storage_provider ?? undefined);
      const blob = await provider.downloadBlob({
        bucket: clip.storage_bucket as string,
        path: clip.storage_path as string,
      });
      const inputPath = join(workDir, `clip-${index}.mp4`);
      const normalizedPath = join(workDir, `normalized-${index}.mp4`);
      await blobToFile(blob, inputPath);

      await runFfmpeg([
        "-y",
        "-i",
        inputPath,
        "-vf",
        `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        normalizedPath,
      ]);

      normalizedPaths.push(normalizedPath);
    }

    const concatListPath = join(workDir, "concat.txt");
    await writeFile(
      concatListPath,
      normalizedPaths
        .map((path) => `file '${escapeConcatPath(path)}'`)
        .join("\n"),
    );

    const mergedPath = join(workDir, "merged.mp4");
    await runFfmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatListPath,
      "-c",
      "copy",
      mergedPath,
    ]);

    const logoPath = await maybeDownloadLogoAsset({
      projectId: job.project_id,
      userId: job.user_id,
      assetId: options.logoAssetId,
      outputPath: join(workDir, "logo.png"),
    });
    const voiceoverPath = await maybeDownloadAudioAsset({
      projectId: job.project_id,
      userId: job.user_id,
      assetId: options.voiceoverAssetId,
      outputPath: join(workDir, "voiceover.audio"),
    });
    const musicPath = await maybeDownloadAudioAsset({
      projectId: job.project_id,
      userId: job.user_id,
      assetId: options.musicAssetId,
      outputPath: join(workDir, "music.audio"),
    });

    const finalPath = join(workDir, "final.mp4");
    const args = ["-y", "-i", mergedPath];
    let inputIndex = 1;
    let logoInputIndex: number | null = null;
    let voiceInputIndex: number | null = null;
    let musicInputIndex: number | null = null;

    if (logoPath) {
      logoInputIndex = inputIndex++;
      args.push("-i", logoPath);
    }
    if (voiceoverPath) {
      voiceInputIndex = inputIndex++;
      args.push("-i", voiceoverPath);
    }
    if (musicPath) {
      musicInputIndex = inputIndex++;
      args.push("-i", musicPath);
    }

    const filters: string[] = [];
    let videoLabel = "0:v";
    let filterIndex = 0;

    if (options.subtitles?.trim()) {
      const nextLabel = `v${filterIndex++}`;
      filters.push(
        `[${videoLabel}]drawtext=text='${escapeDrawText(
          options.subtitles.trim(),
        )}':x=(w-text_w)/2:y=h-(text_h*2)-72:fontcolor=white:fontsize=42:box=1:boxcolor=black@0.55:boxborderw=18[${nextLabel}]`,
      );
      videoLabel = nextLabel;
    }

    if (logoInputIndex !== null) {
      const logoLabel = `logo${filterIndex}`;
      const nextLabel = `v${filterIndex++}`;
      filters.push(
        `[${logoInputIndex}:v]scale=180:-1[${logoLabel}];[${videoLabel}][${logoLabel}]overlay=W-w-40:H-h-40[${nextLabel}]`,
      );
      videoLabel = nextLabel;
    }

    let audioLabel: string | null = null;

    if (voiceInputIndex !== null && musicInputIndex !== null) {
      audioLabel = "aout";
      filters.push(
        `[${voiceInputIndex}:a]volume=1.0[voice];[${musicInputIndex}:a]volume=0.28[music];[voice][music]amix=inputs=2:duration=shortest:dropout_transition=2[${audioLabel}]`,
      );
    } else if (voiceInputIndex !== null) {
      audioLabel = `${voiceInputIndex}:a`;
    } else if (musicInputIndex !== null) {
      audioLabel = "aout";
      filters.push(`[${musicInputIndex}:a]volume=0.35[${audioLabel}]`);
    }

    if (filters.length > 0) {
      args.push("-filter_complex", filters.join(";"));
      args.push("-map", `[${videoLabel}]`);
      if (audioLabel) {
        args.push("-map", audioLabel.includes(":") ? audioLabel : `[${audioLabel}]`);
      } else {
        args.push("-an");
      }
    } else {
      args.push("-map", "0:v:0", "-an");
    }

    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "22",
      "-pix_fmt",
      "yuv420p",
    );

    if (audioLabel) {
      args.push("-c:a", "aac", "-b:a", "192k", "-shortest");
    }

    args.push(finalPath);
    await runFfmpeg(args);

    return {
      data: new Blob([await readFile(finalPath)], { type: "video/mp4" }),
      mimeType: "video/mp4",
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export async function createVideoExport(input: {
  projectId: string;
  userId: string;
  videoIds: string[];
  exportRatio: string;
  options?: ExportOptions;
}) {
  const project = await getProjectById(input.projectId, input.userId);

  if (!project) {
    throw new Error("Project not found.");
  }

  if (!isExportRatio(input.exportRatio)) {
    throw new Error("Export ratio must be 9:16, 1:1, or 16:9.");
  }

  const videoIds = input.videoIds.filter(Boolean);

  if (videoIds.length === 0) {
    throw new Error("Choose at least one generated clip to export.");
  }

  const creditCost = await getFeatureCreditCost("export");
  const wallet = await getUserWallet(input.userId);

  if (wallet.balanceCredit < creditCost) {
    throw new Error(`Insufficient credits. Video export costs ${creditCost} credits.`);
  }

  const referenceId = `${input.projectId}:export:${Date.now()}`;

  await deductCredits({
    userId: input.userId,
    amount: creditCost,
    reason: "Video export",
    referenceType: "video_export",
    referenceId,
    metadata: {
      project_id: input.projectId,
      input_video_ids: videoIds,
      export_ratio: input.exportRatio,
    },
  });

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("export_jobs")
    .insert({
      project_id: input.projectId,
      user_id: input.userId,
      status: "queued",
      export_ratio: input.exportRatio,
      credit_cost: creditCost,
      input_video_ids: videoIds,
      options: input.options ?? {},
      metadata: {
        credit_reference_id: referenceId,
      },
    })
    .select(EXPORT_JOB_SELECT)
    .single<ExportJobRecord>();

  if (error) {
    await refundCredits({
      userId: input.userId,
      amount: creditCost,
      reason: "Refund for failed export job creation",
      referenceType: "video_export_refund",
      referenceId,
      metadata: {
        project_id: input.projectId,
        input_video_ids: videoIds,
      },
    });

    throw error;
  }

  try {
    await updateProject({
      projectId: input.projectId,
      userId: input.userId,
      status: "rendering",
    });

    const processingJob = await updateExportJob(job.id, input.userId, {
      status: "processing",
      started_at: new Date().toISOString(),
    });
    const clips = await getOwnedGeneratedVideos({
      projectId: input.projectId,
      userId: input.userId,
      videoIds,
    });
    const output = await renderWithFfmpeg({
      job: processingJob,
      clips,
      options: input.options ?? {},
    });
    const storageProvider = getAssetStorageProvider();
    const bucket = getGeneratedVideoBucket();
    const storagePath = buildExportPath({
      userId: input.userId,
      projectId: input.projectId,
      exportJobId: job.id,
    });

    await storageProvider.uploadBlob({
      bucket,
      path: storagePath,
      data: output.data,
      contentType: output.mimeType,
    });

    const { error: videoError } = await supabase
      .from("generated_videos")
      .insert({
        project_id: input.projectId,
        user_id: input.userId,
        render_job_id: null,
        file_url: `${storageProvider.name}://${bucket}/${storagePath}`,
        status: "ready",
        provider: "ffmpeg",
        storage_provider: storageProvider.name,
        storage_bucket: bucket,
        storage_path: storagePath,
        mime_type: output.mimeType,
        metadata: {
          export_job_id: job.id,
          export_ratio: input.exportRatio,
          input_video_ids: videoIds,
          export_options: input.options ?? {},
        },
      });

    if (videoError) {
      throw videoError;
    }

    await updateExportJob(job.id, input.userId, {
      status: "completed",
      output_storage_provider: storageProvider.name,
      output_storage_bucket: bucket,
      output_storage_path: storagePath,
      output_mime_type: output.mimeType,
      completed_at: new Date().toISOString(),
      error_message: null,
    });

    await updateProject({
      projectId: input.projectId,
      userId: input.userId,
      status: "completed",
    });

    return getOwnedExportJob(job.id, input.userId);
  } catch (error) {
    const failedJob = await updateExportJob(job.id, input.userId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Video export failed.",
      completed_at: new Date().toISOString(),
    });

    await refundExportCredits(failedJob, "Refund for failed video export");
    throw error;
  }
}
