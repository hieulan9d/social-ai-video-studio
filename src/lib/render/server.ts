import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { getProjectAsset } from "@/lib/assets/server";
import { getAssetStorageProvider } from "@/lib/assets/storage";
import { getProjectDetail, updateProject } from "@/lib/projects/server";
import type {
  GeneratedVideoRecord,
  ProjectDetail,
  PromptRecord,
  RenderJobRecord,
} from "@/lib/projects/types";
import {
  buildImageToVideoPrompt,
  buildStartEndTransitionPrompt,
  isImageToVideoMotionStyle,
  isStartEndTransitionStyle,
} from "@/lib/render/prompts";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { getVideoProvider } from "@/lib/video/providers";
import { deductCredits, getUserWallet, refundCredits } from "@/lib/wallet/server";

const RENDER_JOB_SELECT =
  "id, project_id, user_id, scene_id, prompt_id, source_asset_id, end_asset_id, status, provider, provider_job_id, render_mode, motion_style, credit_cost, prompt_snapshot, provider_operation_name, provider_request, provider_response, output_storage_provider, output_storage_bucket, output_storage_path, output_mime_type, error_message, started_at, completed_at, metadata, created_at, updated_at";

const GENERATED_VIDEO_SELECT =
  "id, project_id, user_id, render_job_id, file_url, thumbnail_url, duration_seconds, status, provider, provider_job_id, storage_provider, storage_bucket, storage_path, mime_type, metadata, created_at, updated_at";

function getGeneratedVideoBucket() {
  return process.env.GENERATED_VIDEO_STORAGE_BUCKET ?? "generated-videos";
}

function chooseAspectRatio(detail: ProjectDetail): "9:16" | "16:9" {
  return detail.project.platform === "Facebook" ? "16:9" : "9:16";
}

function chooseDurationSeconds(detail: ProjectDetail): 4 | 6 | 8 {
  if (detail.project.duration <= 4) return 4;
  if (detail.project.duration <= 6) return 6;
  return 8;
}

function normalizeRenderDuration(value?: number): 4 | 6 | 8 {
  if (value === 4 || value === 6 || value === 8) {
    return value;
  }

  return 6;
}

function getMetadataFlag(metadata: Record<string, unknown>, key: string) {
  return metadata[key] === true;
}

async function getOwnedRenderJob(renderJobId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("render_jobs")
    .select(RENDER_JOB_SELECT)
    .eq("id", renderJobId)
    .eq("user_id", userId)
    .maybeSingle<RenderJobRecord>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Render job not found.");
  }

  return data;
}

function findPrompt(detail: ProjectDetail, promptId: string): PromptRecord {
  const prompt = detail.prompts.find((item) => item.id === promptId);

  if (!prompt) {
    throw new Error("Prompt not found.");
  }

  if (!prompt.scene_id) {
    throw new Error("Prompt must be linked to a scene before rendering.");
  }

  return prompt;
}

function buildOutputPath({
  userId,
  projectId,
  renderJobId,
}: {
  userId: string;
  projectId: string;
  renderJobId: string;
}) {
  return [
    "users",
    userId,
    "projects",
    projectId,
    "generated-videos",
    `${renderJobId}-${randomUUID()}.mp4`,
  ].join("/");
}

async function refundRenderCredits(job: RenderJobRecord, reason: string) {
  if (job.credit_cost <= 0 || getMetadataFlag(job.metadata, "refunded")) {
    return;
  }

  await refundCredits({
    userId: job.user_id,
    amount: job.credit_cost,
    reason,
    referenceType: getRenderRefundReferenceType(job.render_mode),
    referenceId: job.id,
    metadata: {
      project_id: job.project_id,
      render_job_id: job.id,
      provider: job.provider,
    },
  });

  const supabase = await createClient();
  await supabase
    .from("render_jobs")
    .update({
      metadata: {
        ...job.metadata,
        refunded: true,
      },
    })
    .eq("id", job.id)
    .eq("user_id", job.user_id);
}

function getRenderRefundReferenceType(renderMode: RenderJobRecord["render_mode"]) {
  if (renderMode === "image_to_video") {
    return "image_to_video_render_refund";
  }

  if (renderMode === "start_end_transition") {
    return "start_end_transition_render_refund";
  }

  return "text_to_video_render_refund";
}

async function updateRenderJob(
  renderJobId: string,
  userId: string,
  payload: Record<string, unknown>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("render_jobs")
    .update(payload)
    .eq("id", renderJobId)
    .eq("user_id", userId)
    .select(RENDER_JOB_SELECT)
    .single<RenderJobRecord>();

  if (error) {
    throw error;
  }

  return data;
}

async function saveGeneratedVideo({
  job,
  videoUri,
  mimeType,
}: {
  job: RenderJobRecord;
  videoUri: string;
  mimeType: string;
}) {
  const provider = getVideoProvider(job.provider ?? undefined);
  const downloaded = await provider.downloadVideo({ videoUri });
  const storageProvider = getAssetStorageProvider();
  const bucket = getGeneratedVideoBucket();
  const storagePath = buildOutputPath({
    userId: job.user_id,
    projectId: job.project_id,
    renderJobId: job.id,
  });

  await storageProvider.uploadBlob({
    bucket,
    path: storagePath,
    data: downloaded.data,
    contentType: downloaded.mimeType || mimeType || "video/mp4",
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_videos")
    .insert({
      project_id: job.project_id,
      user_id: job.user_id,
      render_job_id: job.id,
      file_url: `${storageProvider.name}://${bucket}/${storagePath}`,
      duration_seconds: null,
      status: "ready",
      provider: job.provider,
      provider_job_id: job.provider_job_id,
      storage_provider: storageProvider.name,
      storage_bucket: bucket,
      storage_path: storagePath,
      mime_type: downloaded.mimeType || mimeType || "video/mp4",
      metadata: {
        source_video_uri: videoUri,
      },
    })
    .select(GENERATED_VIDEO_SELECT)
    .single<GeneratedVideoRecord>();

  if (error) {
    throw error;
  }

  await updateRenderJob(job.id, job.user_id, {
    status: "completed",
    output_storage_provider: storageProvider.name,
    output_storage_bucket: bucket,
    output_storage_path: storagePath,
    output_mime_type: downloaded.mimeType || mimeType || "video/mp4",
    completed_at: new Date().toISOString(),
    error_message: null,
  });

  return data;
}

export async function createTextToVideoRender(input: {
  projectId: string;
  promptId: string;
  userId: string;
}) {
  const detail = await getProjectDetail(input.projectId, input.userId);

  if (!detail) {
    throw new Error("Project not found.");
  }

  const prompt = findPrompt(detail, input.promptId);
  const creditCost = await getFeatureCreditCost("veo_render");
  const wallet = await getUserWallet(input.userId);

  if (wallet.balanceCredit < creditCost) {
    throw new Error(`Insufficient credits. Text-to-video render costs ${creditCost} credits.`);
  }

  const provider = getVideoProvider();
  const referenceId = `${input.projectId}:render:${Date.now()}`;

  await deductCredits({
    userId: input.userId,
    amount: creditCost,
    reason: "Text-to-video render",
    referenceType: "text_to_video_render",
    referenceId,
    metadata: {
      project_id: input.projectId,
      prompt_id: input.promptId,
      provider: provider.name,
    },
  });

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("render_jobs")
    .insert({
      project_id: input.projectId,
      user_id: input.userId,
      scene_id: prompt.scene_id,
      prompt_id: prompt.id,
      status: "queued",
      provider: provider.name,
      render_mode: "text_to_video",
      credit_cost: creditCost,
      prompt_snapshot: prompt.content,
      metadata: {
        credit_reference_id: referenceId,
      },
    })
    .select(RENDER_JOB_SELECT)
    .single<RenderJobRecord>();

  if (error) {
    await refundCredits({
      userId: input.userId,
      amount: creditCost,
      reason: "Refund for failed render job creation",
      referenceType: "text_to_video_render_refund",
      referenceId,
      metadata: {
        project_id: input.projectId,
        prompt_id: input.promptId,
        provider: provider.name,
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

    const request = {
      prompt: prompt.content,
      aspectRatio: chooseAspectRatio(detail),
      durationSeconds: chooseDurationSeconds(detail),
      negativePrompt:
        "subtitles, watermark, distorted face, extra fingers, wrong product label, random text, logo changes",
    } as const;

    const started = await provider.startTextToVideo(request);
    const updatedJob = await updateRenderJob(job.id, input.userId, {
      status: started.status === "completed" ? "processing" : started.status,
      provider_job_id: started.providerJobId,
      provider_operation_name: started.operationName,
      provider_request: request,
      provider_response: started.rawResponse,
      started_at: new Date().toISOString(),
    });

    if (started.status === "completed" && started.videoUri) {
      await saveGeneratedVideo({
        job: updatedJob,
        videoUri: started.videoUri,
        mimeType: started.mimeType ?? "video/mp4",
      });
    }

    return getOwnedRenderJob(job.id, input.userId);
  } catch (error) {
    const failedJob = await updateRenderJob(job.id, input.userId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Video render failed.",
      completed_at: new Date().toISOString(),
    });

    await refundRenderCredits(failedJob, "Refund for failed text-to-video render");
    throw error;
  }
}

export async function createImageToVideoRender(input: {
  projectId: string;
  assetId: string;
  userId: string;
  motionStyle: string;
  durationSeconds?: number;
  prompt?: string;
}) {
  const detail = await getProjectDetail(input.projectId, input.userId);

  if (!detail) {
    throw new Error("Project not found.");
  }

  if (!isImageToVideoMotionStyle(input.motionStyle)) {
    throw new Error("Invalid image-to-video motion style.");
  }

  const asset = await getProjectAsset({
    projectId: input.projectId,
    userId: input.userId,
    assetId: input.assetId,
  });

  if (!asset.mime_type.startsWith("image/")) {
    throw new Error("Image-to-video requires an uploaded image asset.");
  }

  const creditCost = await getFeatureCreditCost("image_to_video");
  const wallet = await getUserWallet(input.userId);

  if (wallet.balanceCredit < creditCost) {
    throw new Error(`Insufficient credits. Image-to-video render costs ${creditCost} credits.`);
  }

  const provider = getVideoProvider();
  const storageProvider = getAssetStorageProvider(asset.storage_provider);
  const referenceId = `${input.projectId}:image-render:${Date.now()}`;
  const prompt = input.prompt?.trim()
    ? input.prompt.trim()
    : buildImageToVideoPrompt({
        motionStyle: input.motionStyle,
      });

  await deductCredits({
    userId: input.userId,
    amount: creditCost,
    reason: "Image-to-video render",
    referenceType: "image_to_video_render",
    referenceId,
    metadata: {
      project_id: input.projectId,
      asset_id: input.assetId,
      provider: provider.name,
      motion_style: input.motionStyle,
    },
  });

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("render_jobs")
    .insert({
      project_id: input.projectId,
      user_id: input.userId,
      source_asset_id: asset.id,
      status: "queued",
      provider: provider.name,
      render_mode: "image_to_video",
      motion_style: input.motionStyle,
      credit_cost: creditCost,
      prompt_snapshot: prompt,
      metadata: {
        credit_reference_id: referenceId,
        source_asset_file_name: asset.file_name,
      },
    })
    .select(RENDER_JOB_SELECT)
    .single<RenderJobRecord>();

  if (error) {
    await refundCredits({
      userId: input.userId,
      amount: creditCost,
      reason: "Refund for failed image-to-video render job creation",
      referenceType: "image_to_video_render_refund",
      referenceId,
      metadata: {
        project_id: input.projectId,
        asset_id: input.assetId,
        provider: provider.name,
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

    const sourceImage = await storageProvider.downloadBlob({
      bucket: asset.storage_bucket,
      path: asset.storage_path,
    });
    const request = {
      prompt,
      aspectRatio: chooseAspectRatio(detail),
      durationSeconds: normalizeRenderDuration(input.durationSeconds),
      negativePrompt:
        "subtitles, watermark, distorted face, extra fingers, wrong product label, random text, logo changes",
    } as const;
    const started = await provider.startImageToVideo({
      ...request,
      image: {
        data: sourceImage,
        mimeType: asset.mime_type,
      },
    });
    const updatedJob = await updateRenderJob(job.id, input.userId, {
      status: started.status === "completed" ? "processing" : started.status,
      provider_job_id: started.providerJobId,
      provider_operation_name: started.operationName,
      provider_request: {
        ...request,
        sourceAssetId: asset.id,
        sourceMimeType: asset.mime_type,
      },
      provider_response: started.rawResponse,
      started_at: new Date().toISOString(),
    });

    if (started.status === "completed" && started.videoUri) {
      await saveGeneratedVideo({
        job: updatedJob,
        videoUri: started.videoUri,
        mimeType: started.mimeType ?? "video/mp4",
      });
    }

    return getOwnedRenderJob(job.id, input.userId);
  } catch (error) {
    const failedJob = await updateRenderJob(job.id, input.userId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Image-to-video render failed.",
      completed_at: new Date().toISOString(),
    });

    await refundRenderCredits(failedJob, "Refund for failed image-to-video render");
    throw error;
  }
}

export async function createStartEndTransitionRender(input: {
  projectId: string;
  startAssetId: string;
  endAssetId: string;
  userId: string;
  transitionStyle: string;
  durationSeconds?: number;
  prompt?: string;
}) {
  const detail = await getProjectDetail(input.projectId, input.userId);

  if (!detail) {
    throw new Error("Project not found.");
  }

  if (!isStartEndTransitionStyle(input.transitionStyle)) {
    throw new Error("Invalid start-end transition style.");
  }

  if (input.startAssetId === input.endAssetId) {
    throw new Error("Start and end images must be different assets.");
  }

  const [startAsset, endAsset] = await Promise.all([
    getProjectAsset({
      projectId: input.projectId,
      userId: input.userId,
      assetId: input.startAssetId,
    }),
    getProjectAsset({
      projectId: input.projectId,
      userId: input.userId,
      assetId: input.endAssetId,
    }),
  ]);

  if (
    !startAsset.mime_type.startsWith("image/") ||
    !endAsset.mime_type.startsWith("image/")
  ) {
    throw new Error("Start-end transition requires uploaded image assets.");
  }

  const creditCost = await getFeatureCreditCost("transition_video");
  const wallet = await getUserWallet(input.userId);

  if (wallet.balanceCredit < creditCost) {
    throw new Error(
      `Insufficient credits. Start-end transition render costs ${creditCost} credits.`,
    );
  }

  const provider = getVideoProvider();
  const startStorageProvider = getAssetStorageProvider(startAsset.storage_provider);
  const endStorageProvider = getAssetStorageProvider(endAsset.storage_provider);
  const referenceId = `${input.projectId}:transition-render:${Date.now()}`;
  const prompt = input.prompt?.trim()
    ? input.prompt.trim()
    : buildStartEndTransitionPrompt({
        transitionStyle: input.transitionStyle,
      });

  await deductCredits({
    userId: input.userId,
    amount: creditCost,
    reason: "Start-end image transition render",
    referenceType: "start_end_transition_render",
    referenceId,
    metadata: {
      project_id: input.projectId,
      start_asset_id: input.startAssetId,
      end_asset_id: input.endAssetId,
      provider: provider.name,
      transition_style: input.transitionStyle,
    },
  });

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("render_jobs")
    .insert({
      project_id: input.projectId,
      user_id: input.userId,
      source_asset_id: startAsset.id,
      end_asset_id: endAsset.id,
      status: "queued",
      provider: provider.name,
      render_mode: "start_end_transition",
      motion_style: input.transitionStyle,
      credit_cost: creditCost,
      prompt_snapshot: prompt,
      metadata: {
        credit_reference_id: referenceId,
        start_asset_file_name: startAsset.file_name,
        end_asset_file_name: endAsset.file_name,
      },
    })
    .select(RENDER_JOB_SELECT)
    .single<RenderJobRecord>();

  if (error) {
    await refundCredits({
      userId: input.userId,
      amount: creditCost,
      reason: "Refund for failed start-end transition job creation",
      referenceType: "start_end_transition_render_refund",
      referenceId,
      metadata: {
        project_id: input.projectId,
        start_asset_id: input.startAssetId,
        end_asset_id: input.endAssetId,
        provider: provider.name,
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

    const [startImage, endImage] = await Promise.all([
      startStorageProvider.downloadBlob({
        bucket: startAsset.storage_bucket,
        path: startAsset.storage_path,
      }),
      endStorageProvider.downloadBlob({
        bucket: endAsset.storage_bucket,
        path: endAsset.storage_path,
      }),
    ]);
    const request = {
      prompt,
      aspectRatio: chooseAspectRatio(detail),
      durationSeconds: normalizeRenderDuration(input.durationSeconds),
      negativePrompt:
        "subtitles, watermark, distorted face, extra fingers, wrong product label, random text, logo changes, identity jump",
    } as const;
    const started = await provider.startEndImageTransition({
      ...request,
      startImage: {
        data: startImage,
        mimeType: startAsset.mime_type,
      },
      endImage: {
        data: endImage,
        mimeType: endAsset.mime_type,
      },
    });
    const updatedJob = await updateRenderJob(job.id, input.userId, {
      status: started.status === "completed" ? "processing" : started.status,
      provider_job_id: started.providerJobId,
      provider_operation_name: started.operationName,
      provider_request: {
        ...request,
        startAssetId: startAsset.id,
        startMimeType: startAsset.mime_type,
        endAssetId: endAsset.id,
        endMimeType: endAsset.mime_type,
      },
      provider_response: started.rawResponse,
      started_at: new Date().toISOString(),
    });

    if (started.status === "completed" && started.videoUri) {
      await saveGeneratedVideo({
        job: updatedJob,
        videoUri: started.videoUri,
        mimeType: started.mimeType ?? "video/mp4",
      });
    }

    return getOwnedRenderJob(job.id, input.userId);
  } catch (error) {
    const failedJob = await updateRenderJob(job.id, input.userId, {
      status: "failed",
      error_message:
        error instanceof Error
          ? error.message
          : "Start-end transition render failed.",
      completed_at: new Date().toISOString(),
    });

    await refundRenderCredits(failedJob, "Refund for failed start-end transition render");
    throw error;
  }
}

export async function syncRenderJob(renderJobId: string, userId: string) {
  const job = await getOwnedRenderJob(renderJobId, userId);

  if (job.status === "completed" || job.status === "failed") {
    return job;
  }

  if (!job.provider_operation_name) {
    throw new Error("Render job has no provider operation name.");
  }

  const provider = getVideoProvider(job.provider ?? undefined);
  const status = await provider.getRenderStatus({
    operationName: job.provider_operation_name,
    providerJobId: job.provider_job_id,
  });

  if (status.status === "processing") {
    return updateRenderJob(job.id, userId, {
      status: "processing",
      provider_response: status.rawResponse,
    });
  }

  if (status.status === "failed") {
    const failedJob = await updateRenderJob(job.id, userId, {
      status: "failed",
      provider_response: status.rawResponse,
      error_message: status.errorMessage ?? "Video render failed.",
      completed_at: new Date().toISOString(),
    });

    await refundRenderCredits(failedJob, "Refund for failed video render");
    return failedJob;
  }

  if (!status.videoUri) {
    const failedJob = await updateRenderJob(job.id, userId, {
      status: "failed",
      provider_response: status.rawResponse,
      error_message: "Provider completed without a video URI.",
      completed_at: new Date().toISOString(),
    });

    await refundRenderCredits(failedJob, "Refund for failed video render");
    return failedJob;
  }

  await updateRenderJob(job.id, userId, {
    provider_response: status.rawResponse,
  });

  await saveGeneratedVideo({
    job,
    videoUri: status.videoUri,
    mimeType: status.mimeType ?? "video/mp4",
  });

  return getOwnedRenderJob(job.id, userId);
}

export async function listRenderHistory(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("render_jobs")
    .select(RENDER_JOB_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<RenderJobRecord[]>();

  if (error) {
    throw error;
  }

  return data;
}

export async function listGeneratedVideosForUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generated_videos")
    .select(GENERATED_VIDEO_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<GeneratedVideoRecord[]>();

  if (error) {
    throw error;
  }

  return Promise.all(
    data.map(async (video) => ({
      ...video,
      file_url: await createGeneratedVideoDownloadUrl(video),
    })),
  );
}

export async function createGeneratedVideoDownloadUrl(video: GeneratedVideoRecord) {
  if (!video.storage_provider || !video.storage_bucket || !video.storage_path) {
    return video.file_url;
  }

  const provider = getAssetStorageProvider(video.storage_provider);

  return provider.createSignedReadUrl({
    bucket: video.storage_bucket,
    path: video.storage_path,
    expiresInSeconds: 60 * 10,
  });
}
