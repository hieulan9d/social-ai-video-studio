import "server-only";

import { createClient } from "@/lib/supabase/server";
import { saveGeneratedProjectAsset } from "@/lib/ai/generated-assets";
import { generateImageWithNineRouter } from "@/lib/ai/nine-router-media-provider";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { deductCredits, refundCredits } from "@/lib/wallet/server";

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

  await deductCredits({
    userId,
    amount: creditCost,
    reason: projectId ? "Tạo ảnh trong dự án" : "Tạo ảnh nhanh",
    referenceType: "image_generation",
    referenceId,
    metadata: { project_id: projectId ?? null, model, quantity: normalizedQuantity },
  });

  try {
    const result = await generateImageWithNineRouter({
      prompt: normalizedPrompt,
      model,
      aspectRatio,
      quantity: normalizedQuantity,
      referenceImage,
    });

    if (projectId) {
      const assets = await Promise.all(
        result.outputUrls.map((outputUrl) =>
          saveGeneratedProjectAsset({
            userId,
            projectId,
            type: "image",
            prompt: normalizedPrompt,
            model,
            outputUrl,
            metadata: {
              aspect_ratio: aspectRatio,
              provider_response: result.rawResponse,
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
          model,
          output_url: outputUrl,
          status: "completed",
          aspect_ratio: aspectRatio,
          quantity: normalizedQuantity,
          reference_file_name: referenceImage?.name ?? null,
          metadata: { provider_response: result.rawResponse },
        })),
      )
      .select("*");

    if (error) {
      throw error;
    }

    return { type: "quick" as const, generations: data, outputUrls: result.outputUrls };
  } catch (error) {
    if (!projectId) {
      const supabase = await createClient();
      await supabase.from("quick_generations").insert({
        user_id: userId,
        type: "image",
        prompt: normalizedPrompt,
        model,
        output_url: null,
        status: "failed",
        aspect_ratio: aspectRatio,
        quantity: normalizedQuantity,
        reference_file_name: referenceImage?.name ?? null,
        error_message: error instanceof Error ? error.message : "Tạo ảnh thất bại.",
      });
    }

    await refundCredits({
      userId,
      amount: creditCost,
      reason: "Hoàn tín dụng do tạo ảnh thất bại",
      referenceType: "image_generation_refund",
      referenceId,
      metadata: { project_id: projectId ?? null, model },
    });

    throw error;
  }
}
