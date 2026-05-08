/**
 * AI Video Service
 * Hỗ trợ: text-to-video, image-to-video, start-end-image-to-video
 * Dùng veo-3 / veo-3-fast qua 9Router
 * Tách riêng để dễ swap endpoint sau này
 */

import { videoGeneration } from "./client";
import { getModelByTask } from "./model-router";

export type VideoMode =
  | "text-to-video"
  | "image-to-video"
  | "start-end-image-to-video";

export interface GenerateVideoParams {
  prompt: string;
  mode?: VideoMode;
  /** Base64 string của start image (không có tiền tố data:image...) */
  startImage?: string;
  /** Base64 string của end image */
  endImage?: string;
  duration?: 5 | 8 | 10;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  fast?: boolean;
}

export interface GenerateVideoResult {
  success: true;
  videoUrl?: string;
  jobId?: string;
  model: string;
  status: string;
}

export type GenerateVideoError = {
  success: false;
  error: string;
};

export async function generateVideo(
  params: GenerateVideoParams
): Promise<GenerateVideoResult | GenerateVideoError> {
  const {
    prompt,
    mode = "text-to-video",
    startImage,
    endImage,
    duration = 5,
    aspectRatio = "16:9",
    fast = false,
  } = params;

  if (!prompt || prompt.trim().length === 0) {
    return { success: false, error: "Prompt không được để trống." };
  }

  if (mode === "image-to-video" && !startImage) {
    return {
      success: false,
      error: 'Mode "image-to-video" yêu cầu startImage.',
    };
  }

  if (mode === "start-end-image-to-video" && (!startImage || !endImage)) {
    return {
      success: false,
      error: 'Mode "start-end-image-to-video" yêu cầu cả startImage và endImage.',
    };
  }

  const model = getModelByTask(fast ? "video_fast" : "video");

  try {
    const result = await videoGeneration({
      model,
      prompt,
      startImageBase64: startImage,
      endImageBase64: endImage,
      duration,
      aspectRatio,
    });

    return {
      success: true,
      videoUrl: result.videoUrl,
      jobId: result.jobId,
      model: result.model,
      status: result.status,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
