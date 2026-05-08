import "server-only";

import { createClient } from "@/lib/supabase/server";
import { saveGeneratedProjectAsset } from "@/lib/ai/generated-assets";
import { generateImageWithNineRouter } from "@/lib/ai/nine-router-media-provider";
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
    throw new Error("Prompt phai co it nhat 3 ky tu.");
  }

  const normalizedQuantity = Math.min(4, Math.max(1, Math.trunc(quantity || 1)));
  const creditCost = (await getFeatureCreditCost("image_generation")) * normalizedQuantity;
  const referenceId = `${projectId ?? "quick"}:image:${Date.now()}`;

  await deductCredits({
    userId,
    amount: creditCost,
    reason: projectId ? "Tao anh trong du an" : "Tao anh nhanh",
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
      if (isMissingQuickGenerationsTableError(error)) {
        return {
          type: "ephemeral" as const,
          outputs: result.outputUrls.map((outputUrl, index) => ({
            id: `ephemeral-image-${Date.now()}-${index}`,
            output_url: outputUrl,
            prompt: normalizedPrompt,
            model,
          })),
          outputUrls: result.outputUrls,
          warning:
            "Bang quick_generations chua ton tai. Output da duoc tao nhung chua luu vao lich su nhanh.",
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
        model,
        output_url: null,
        status: "failed",
        aspect_ratio: aspectRatio,
        quantity: normalizedQuantity,
        reference_file_name: referenceImage?.name ?? null,
        error_message: error instanceof Error ? error.message : "Tao anh that bai.",
      });

      if (insertError && !isMissingQuickGenerationsTableError(insertError)) {
        throw insertError;
      }
    }

    await refundCredits({
      userId,
      amount: creditCost,
      reason: "Hoan tin dung do tao anh that bai",
      referenceType: "image_generation_refund",
      referenceId,
      metadata: { project_id: projectId ?? null, model },
    });

    throw error;
  }
}
