import "server-only";

import { createClient } from "@/lib/supabase/server";
import { saveGeneratedProjectAsset } from "@/lib/ai/generated-assets";
import { generateImageWithNineRouter } from "@/lib/ai/nine-router-media-provider";
import { getRoutedModelCandidates } from "@/lib/ai/smart-routing";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { deductCredits, refundCredits } from "@/lib/wallet/server";

function isMissingQuickGenerationsTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : "";
  const details = typeof record.details === "string" ? record.details : "";
  return `${message} ${details}`.includes("public.quick_generations");
}

async function generateImageOutputs(input: {
  prompt: string;
  model: string;
  aspectRatio: string;
  quantity: number;
  referenceImage?: File | null;
}) {
  const firstResult = await generateImageWithNineRouter({
    prompt: input.prompt,
    model: input.model,
    aspectRatio: input.aspectRatio,
    quantity: input.quantity,
    referenceImage: input.referenceImage,
  });

  const outputUrls = [...firstResult.outputUrls];
  const rawResponses: Record<string, unknown>[] = [firstResult.rawResponse];

  while (outputUrls.length < input.quantity) {
    const fallbackResult = await generateImageWithNineRouter({
      prompt: input.prompt,
      model: input.model,
      aspectRatio: input.aspectRatio,
      quantity: 1,
      referenceImage: input.referenceImage,
    });

    outputUrls.push(...fallbackResult.outputUrls);
    rawResponses.push(fallbackResult.rawResponse);
  }

  return {
    outputUrls: outputUrls.slice(0, input.quantity),
    rawResponses,
  };
}

export async function generateImage({
  userId,
  prompt,
  model,
  referenceImage,
  aspectRatio,
  quantity,
  projectId,
}: {
  userId: string;
  prompt: string;
  model: string;
  referenceImage?: File | null;
  aspectRatio: string;
  quantity: number;
  projectId?: string | null;
}) {
  const normalizedPrompt = prompt.trim();

  if (normalizedPrompt.length < 3) {
    throw new Error("Prompt phải có ít nhất 3 ký tự.");
  }

  const normalizedQuantity = Math.min(4, Math.max(1, Math.trunc(quantity || 1)));
  const creditCost = (await getFeatureCreditCost("image_generation")) * normalizedQuantity;
  const referenceId = `${projectId ?? "quick"}:image:${Date.now()}`;
  const { models, settings } = await getRoutedModelCandidates({
    task: "image",
    requestedModel: model,
  });
  const candidateModels = settings.autoFallbackOnError ? models : models.slice(0, 1);
  const primaryModel = candidateModels[0] ?? model;

  await deductCredits({
    userId,
    amount: creditCost,
    reason: projectId ? "Tạo ảnh trong dự án" : "Tạo ảnh nhanh",
    referenceType: "image_generation",
    referenceId,
    metadata: {
      project_id: projectId ?? null,
      requested_model: model,
      routed_model: primaryModel,
      quantity: normalizedQuantity,
    },
  });

  try {
    let result:
      | {
          outputUrls: string[];
          rawResponses: Record<string, unknown>[];
        }
      | null = null;
    let resolvedModel = primaryModel;
    let lastError: unknown = null;

    for (const candidateModel of candidateModels) {
      try {
        result = await generateImageOutputs({
          prompt: normalizedPrompt,
          model: candidateModel,
          aspectRatio,
          quantity: normalizedQuantity,
          referenceImage,
        });
        resolvedModel = candidateModel;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!result) {
      throw lastError;
    }

    if (projectId) {
      const assets = await Promise.all(
        result.outputUrls.map((outputUrl) =>
          saveGeneratedProjectAsset({
            userId,
            projectId,
            type: "image",
            prompt: normalizedPrompt,
            model: resolvedModel,
            outputUrl,
            metadata: {
              aspect_ratio: aspectRatio,
              provider_response: result.rawResponses,
            },
          }),
        ),
      );

      return { type: "project" as const, assets, outputUrls: result.outputUrls };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quick_generations")
      .insert(
        result.outputUrls.map((outputUrl) => ({
          user_id: userId,
          type: "image",
          prompt: normalizedPrompt,
          model: resolvedModel,
          output_url: outputUrl,
          status: "completed",
          aspect_ratio: aspectRatio,
          quantity: normalizedQuantity,
          reference_file_name: referenceImage?.name ?? null,
          metadata: { provider_response: result.rawResponses },
        })),
      )
      .select("*");

    if (error) {
      if (isMissingQuickGenerationsTableError(error)) {
        return {
          type: "ephemeral" as const,
          outputs: result.outputUrls.map((outputUrl, index) => ({
            id: `ephemeral-image-${Date.now()}-${index}`,
            output_url: outputUrl,
            prompt: normalizedPrompt,
            model: resolvedModel,
          })),
          outputUrls: result.outputUrls,
          warning:
            "Bảng quick_generations chưa tồn tại. Output đã được tạo nhưng chưa lưu vào lịch sử nhanh.",
        };
      }

      throw error;
    }

    return { type: "quick" as const, generations: data, outputUrls: result.outputUrls };
  } catch (error) {
    if (!projectId) {
      const supabase = await createClient();
      const { error: insertError } = await supabase.from("quick_generations").insert({
        user_id: userId,
        type: "image",
        prompt: normalizedPrompt,
        model: primaryModel,
        output_url: null,
        status: "failed",
        aspect_ratio: aspectRatio,
        quantity: normalizedQuantity,
        reference_file_name: referenceImage?.name ?? null,
        error_message: error instanceof Error ? error.message : "Tạo ảnh thất bại.",
      });

      if (insertError && !isMissingQuickGenerationsTableError(insertError)) {
        throw insertError;
      }
    }

    await refundCredits({
      userId,
      amount: creditCost,
      reason: "Hoàn tín dụng do tạo ảnh thất bại",
      referenceType: "image_generation_refund",
      referenceId,
      metadata: { project_id: projectId ?? null, model: primaryModel },
    });

    throw error;
  }
}
