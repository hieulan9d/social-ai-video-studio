import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getAssetStorageProvider } from "@/lib/assets/storage";
import { GoogleVeoProvider } from "@/lib/video/providers/google-veo-provider";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { deductCredits, refundCredits } from "@/lib/wallet/server";

const VIDEO_BUCKET = process.env.GENERATED_VIDEO_STORAGE_BUCKET ?? "generated-videos";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 8 * 60 * 1000;

function isMissingQuickGenerationsTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : "";
  const details = typeof record.details === "string" ? record.details : "";
  return `${message} ${details}`.includes("public.quick_generations");
}

function resolveGoogleVeoModel(selectedModel: string) {
  if (selectedModel === "veo-3-fast") {
    return (
      process.env.GOOGLE_VEO_FAST_MODEL ??
      process.env.GOOGLE_VEO_MODEL ??
      "veo-3.1-fast-generate-preview"
    );
  }

  return process.env.GOOGLE_VEO_MODEL ?? "veo-3.1-fast-generate-preview";
}

function normalizeAspectRatio(value: string): "9:16" | "16:9" | "1:1" {
  if (value === "16:9" || value === "1:1") {
    return value;
  }

  return "9:16";
}

function normalizeDurationSeconds(value: number) {
  const normalized = Math.trunc(value || 5);

  if (normalized <= 5) {
    return 4;
  }

  if (normalized <= 7) {
    return 6;
  }

  return 8;
}

function buildQuickVideoPath(userId: string) {
  return ["users", userId, "quick-generations", `video-${randomUUID()}.mp4`].join("/");
}

function buildProjectVideoPath(userId: string, projectId: string) {
  return ["users", userId, "projects", projectId, "generated-videos", `video-${randomUUID()}.mp4`].join("/");
}

async function fileToBlob(file?: File | null) {
  if (!file) {
    return null;
  }

  return new Blob([await file.arrayBuffer()], {
    type: file.type || "application/octet-stream",
  });
}

async function fetchUrlToBlob(url?: string | null) {
  if (!url?.trim()) {
    return null;
  }

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Khong the tai tai nguyen tu URL: ${url}`);
  }

  return response.blob();
}

async function resolveSingleImageInput(input: {
  file?: File | null;
  url?: string | null;
  fallbackFile?: File | null;
}) {
  const directFile = await fileToBlob(input.file);
  if (directFile) {
    return {
      data: directFile,
      mimeType: directFile.type || input.file?.type || "image/png",
    };
  }

  const remoteBlob = await fetchUrlToBlob(input.url);
  if (remoteBlob) {
    return {
      data: remoteBlob,
      mimeType: remoteBlob.type || "image/png",
    };
  }

  const fallbackBlob = await fileToBlob(input.fallbackFile);
  if (fallbackBlob) {
    return {
      data: fallbackBlob,
      mimeType: fallbackBlob.type || input.fallbackFile?.type || "image/png",
    };
  }

  return null;
}

async function waitForGoogleVeoCompletion(provider: GoogleVeoProvider, operationName: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const status = await provider.getRenderStatus({ operationName });

    if (status.status === "completed") {
      if (!status.videoUri) {
        throw new Error("Google Veo completed without a downloadable video URI.");
      }

      return status;
    }

    if (status.status === "failed") {
      throw new Error(status.errorMessage ?? "Google Veo render failed.");
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Google Veo render timeout. Vui long thu lai.");
}

async function uploadVideoAndGetSignedUrl({
  videoBlob,
  userId,
  projectId,
}: {
  videoBlob: Blob;
  userId: string;
  projectId?: string | null;
}) {
  const provider = getAssetStorageProvider();
  const path = projectId ? buildProjectVideoPath(userId, projectId) : buildQuickVideoPath(userId);

  await provider.uploadBlob({
    bucket: VIDEO_BUCKET,
    path,
    data: videoBlob,
    contentType: videoBlob.type || "video/mp4",
  });

  const signedUrl = await provider.createSignedReadUrl({
    bucket: VIDEO_BUCKET,
    path,
    expiresInSeconds: 60 * 60 * 24,
  });

  return {
    storageProvider: provider.name,
    storageBucket: VIDEO_BUCKET,
    storagePath: path,
    signedUrl,
  };
}

async function insertGeneratedProjectVideoAsset({
  userId,
  projectId,
  prompt,
  model,
  signedUrl,
  storageProvider,
  storageBucket,
  storagePath,
  metadata,
}: {
  userId: string;
  projectId: string;
  prompt: string;
  model: string;
  signedUrl: string;
  storageProvider: string;
  storageBucket: string;
  storagePath: string;
  metadata: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const id = randomUUID();
  const { data, error } = await supabase
    .from("project_assets")
    .insert({
      id,
      project_id: projectId,
      user_id: userId,
      asset_type: "generated_video",
      type: "video",
      storage_provider: storageProvider,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      file_name: `video-${id}.mp4`,
      file_url: null,
      output_url: null,
      mime_type: "video/mp4",
      file_size: 0,
      prompt,
      model,
      status: "completed",
      metadata,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    output_url: signedUrl,
    file_url: signedUrl,
  };
}

export async function generateVideo({
  userId,
  prompt,
  model,
  duration,
  aspectRatio,
  referenceAsset,
  startImage,
  endImage,
  startImageUrl,
  endImageUrl,
  videoMode,
  projectId,
}: {
  userId: string;
  prompt: string;
  model: string;
  duration: number;
  aspectRatio: string;
  referenceAsset?: File | null;
  startImage?: File | null;
  endImage?: File | null;
  startImageUrl?: string | null;
  endImageUrl?: string | null;
  videoMode?: "text-to-video" | "image-to-video" | "start-end-image-to-video";
  projectId?: string | null;
}) {
  const normalizedPrompt = prompt.trim();

  if (normalizedPrompt.length < 3) {
    throw new Error("Prompt phai co it nhat 3 ky tu.");
  }

  const normalizedDuration = normalizeDurationSeconds(duration);
  const normalizedAspectRatio = normalizeAspectRatio(aspectRatio);
  const resolvedVideoMode =
    videoMode ??
    (startImage || endImage || startImageUrl || endImageUrl
      ? startImage || startImageUrl
        ? endImage || endImageUrl
          ? "start-end-image-to-video"
          : "image-to-video"
        : "image-to-video"
      : referenceAsset
        ? "image-to-video"
        : "text-to-video");
  const creditCost = await getFeatureCreditCost("video_generation");
  const referenceId = `${projectId ?? "quick"}:video:${Date.now()}`;
  const veoModel = resolveGoogleVeoModel(model);

  await deductCredits({
    userId,
    amount: creditCost,
    reason: projectId ? "Tao video trong du an" : "Tao video nhanh",
    referenceType: "video_generation",
    referenceId,
    metadata: {
      project_id: projectId ?? null,
      requested_model: model,
      provider_model: veoModel,
      duration: normalizedDuration,
      video_mode: resolvedVideoMode,
    },
  });

  try {
    const provider = new GoogleVeoProvider(veoModel);
    const negativePrompt =
      "subtitles, watermark, random text, distorted face, broken hands, extra fingers, logo changes";

    let started;

    if (resolvedVideoMode === "text-to-video") {
      started = await provider.startTextToVideo({
        prompt: normalizedPrompt,
        aspectRatio: normalizedAspectRatio,
        durationSeconds: normalizedDuration,
        negativePrompt,
      });
    } else if (resolvedVideoMode === "image-to-video") {
      const imageInput = await resolveSingleImageInput({
        file: startImage,
        url: startImageUrl,
        fallbackFile: referenceAsset,
      });

      if (!imageInput) {
        throw new Error("Image-to-video can 1 anh dau vao hop le.");
      }

      started = await provider.startImageToVideo({
        prompt: normalizedPrompt,
        aspectRatio: normalizedAspectRatio,
        durationSeconds: normalizedDuration,
        negativePrompt,
        image: imageInput,
      });
    } else {
      const resolvedStartImage = await resolveSingleImageInput({
        file: startImage,
        url: startImageUrl,
      });
      const resolvedEndImage = await resolveSingleImageInput({
        file: endImage,
        url: endImageUrl,
      });

      if (!resolvedStartImage || !resolvedEndImage) {
        throw new Error("Start/end image to video can ca 2 anh hop le.");
      }

      started = await provider.startEndImageTransition({
        prompt: normalizedPrompt,
        aspectRatio: normalizedAspectRatio,
        durationSeconds: normalizedDuration,
        negativePrompt,
        startImage: resolvedStartImage,
        endImage: resolvedEndImage,
      });
    }

    const completed = await waitForGoogleVeoCompletion(provider, started.operationName);
    const downloaded = await provider.downloadVideo({
      videoUri: completed.videoUri!,
    });
    const uploaded = await uploadVideoAndGetSignedUrl({
      videoBlob: downloaded.data,
      userId,
      projectId,
    });

    const metadata = {
      aspect_ratio: normalizedAspectRatio,
      duration_seconds: normalizedDuration,
      video_mode: resolvedVideoMode,
      provider: provider.name,
      provider_model: provider.model,
      provider_operation_name: started.operationName,
      provider_response: completed.rawResponse,
      start_image_url: startImageUrl ?? null,
      end_image_url: endImageUrl ?? null,
    };

    if (projectId) {
      const asset = await insertGeneratedProjectVideoAsset({
        userId,
        projectId,
        prompt: normalizedPrompt,
        model: provider.model,
        signedUrl: uploaded.signedUrl,
        storageProvider: uploaded.storageProvider,
        storageBucket: uploaded.storageBucket,
        storagePath: uploaded.storagePath,
        metadata,
      });

      return { type: "project" as const, asset, outputUrl: uploaded.signedUrl };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quick_generations")
      .insert({
        user_id: userId,
        type: "video",
        prompt: normalizedPrompt,
        model: provider.model,
        output_url: uploaded.signedUrl,
        status: "completed",
        aspect_ratio: normalizedAspectRatio,
        duration_seconds: normalizedDuration,
        quantity: 1,
        reference_file_name:
          referenceAsset?.name ?? startImage?.name ?? endImage?.name ?? null,
        metadata,
      })
      .select("*")
      .single();

    if (error) {
      if (isMissingQuickGenerationsTableError(error)) {
        return {
          type: "ephemeral" as const,
          output: {
            id: `ephemeral-video-${Date.now()}`,
            output_url: uploaded.signedUrl,
            prompt: normalizedPrompt,
            model: provider.model,
          },
          outputUrl: uploaded.signedUrl,
          warning:
            "Bang quick_generations chua ton tai. Output da duoc tao nhung chua luu vao lich su nhanh.",
        };
      }

      throw error;
    }

    return { type: "quick" as const, generation: data, outputUrl: uploaded.signedUrl };
  } catch (error) {
    if (!projectId) {
      const supabase = await createClient();
      const { error: insertError } = await supabase.from("quick_generations").insert({
        user_id: userId,
        type: "video",
        prompt: normalizedPrompt,
        model: veoModel,
        output_url: null,
        status: "failed",
        aspect_ratio: normalizedAspectRatio,
        duration_seconds: normalizedDuration,
        quantity: 1,
        reference_file_name:
          referenceAsset?.name ?? startImage?.name ?? endImage?.name ?? null,
        metadata: {
          video_mode: resolvedVideoMode,
          start_image_url: startImageUrl ?? null,
          end_image_url: endImageUrl ?? null,
        },
        error_message: error instanceof Error ? error.message : "Tao video that bai.",
      });

      if (insertError && !isMissingQuickGenerationsTableError(insertError)) {
        throw insertError;
      }
    }

    await refundCredits({
      userId,
      amount: creditCost,
      reason: "Hoan tin dung do tao video that bai",
      referenceType: "video_generation_refund",
      referenceId,
      metadata: { project_id: projectId ?? null, model: veoModel },
    });

    throw error;
  }
}
