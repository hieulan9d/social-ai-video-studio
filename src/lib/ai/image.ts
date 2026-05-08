import { imageGeneration } from "./client";
import { getModelCandidatesByTask } from "./model-router";

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
  params: GenerateImageParams,
): Promise<GenerateImageResult | GenerateImageError> {
  const { prompt, size = "1024x1024", quality = "high" } = params;
  const { models, settings } = await getModelCandidatesByTask("image");
  const candidates = settings.autoFallbackOnError ? models : models.slice(0, 1);
  let lastMessage = "Image generation failed.";

  for (const model of candidates) {
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
      const firstMessage = firstErr instanceof Error ? firstErr.message : String(firstErr);
      lastMessage = firstMessage;

      const isParamError =
        firstMessage.includes("400") ||
        firstMessage.includes("quality") ||
        firstMessage.includes("output_format") ||
        firstMessage.includes("response_format") ||
        firstMessage.includes("unsupported");

      if (!isParamError) {
        continue;
      }

      try {
        const retryResult = await imageGeneration({ model, prompt, size });

        return {
          success: true,
          imageBase64: retryResult.imageBase64,
          imageUrl: retryResult.imageUrl,
          model: retryResult.model,
          size,
        };
      } catch (retryError) {
        lastMessage = retryError instanceof Error ? retryError.message : String(retryError);
      }
    }
  }

  return { success: false, error: lastMessage };
}
