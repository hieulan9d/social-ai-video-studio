/**
 * AI Image Service
 * Tạo ảnh qua gpt-image-1 → 9Router
 * Retry với request tối giản nếu gateway không support quality/output_format
 */

import { imageGeneration } from "./client";
import { getModelByTask } from "./model-router";

export interface GenerateImageParams {
  prompt: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024";
  quality?: "low" | "medium" | "high";
  outputFormat?: "png" | "jpeg" | "webp";
}

export interface GenerateImageResult {
  success: true;
  imageBase64?: string;
  imageUrl?: string;
  model: string;
  size: string;
}

export type GenerateImageError = {
  success: false;
  error: string;
};

export async function generateImage(
  params: GenerateImageParams
): Promise<GenerateImageResult | GenerateImageError> {
  const {
    prompt,
    size = "1024x1024",
    quality = "high",
  } = params;

  const model = getModelByTask("image");

  // Thử lần 1: full params
  try {
    const result = await imageGeneration({
      model,
      prompt,
      size,
      quality,
      response_format: "b64_json",
    });

    return {
      success: true,
      imageBase64: result.imageBase64,
      imageUrl: result.imageUrl,
      model: result.model,
      size,
    };
  } catch (firstErr) {
    const firstMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);

    // Nếu lỗi có thể do gateway không support quality/output_format → retry tối giản
    const isParamError =
      firstMsg.includes("400") ||
      firstMsg.includes("quality") ||
      firstMsg.includes("output_format") ||
      firstMsg.includes("response_format") ||
      firstMsg.includes("unsupported");

    if (!isParamError) {
      return { success: false, error: firstMsg };
    }

    // Retry lần 2: chỉ model + prompt + size
    try {
      const retryResult = await imageGeneration({ model, prompt, size });

      return {
        success: true,
        imageBase64: retryResult.imageBase64,
        imageUrl: retryResult.imageUrl,
        model: retryResult.model,
        size,
      };
    } catch (retryErr) {
      const retryMsg =
        retryErr instanceof Error ? retryErr.message : String(retryErr);
      return {
        success: false,
        error: `[Lần 1] ${firstMsg} | [Retry] ${retryMsg}`,
      };
    }
  }
}
