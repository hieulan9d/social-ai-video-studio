import "server-only";

import { createClient } from "@/lib/supabase/server";
import { saveGeneratedProjectAsset } from "@/lib/ai/generated-assets";
import { generateVideoWithNineRouter } from "@/lib/ai/nine-router-media-provider";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { deductCredits, refundCredits } from "@/lib/wallet/server";

export async function generateVideo({
  userId,
  prompt,
  model,
  duration,
  aspectRatio,
  referenceAsset,
  projectId,
}: {
  userId: string;
  prompt: string;
  model: string;
  duration: number;
  aspectRatio: string;
  referenceAsset?: File | null;
  projectId?: string | null;
}) {
  const normalizedPrompt = prompt.trim();

  if (normalizedPrompt.length < 3) {
    throw new Error("Prompt phải có ít nhất 3 ký tự.");
  }

  const normalizedDuration = Math.min(30, Math.max(1, Math.trunc(duration || 5)));
  const creditCost = await getFeatureCreditCost("video_generation");
  const referenceId = `${projectId ?? "quick"}:video:${Date.now()}`;

  await deductCredits({
    userId,
    amount: creditCost,
    reason: projectId ? "Tạo video trong dự án" : "Tạo video nhanh",
    referenceType: "video_generation",
    referenceId,
    metadata: { project_id: projectId ?? null, model, duration: normalizedDuration },
  });

  try {
    const result = await generateVideoWithNineRouter({
      prompt: normalizedPrompt,
      model,
      duration: normalizedDuration,
      aspectRatio,
      referenceAsset,
    });

    const outputUrl = result.outputUrls[0];

    if (projectId) {
      const asset = await saveGeneratedProjectAsset({
        userId,
        projectId,
        type: "video",
        prompt: normalizedPrompt,
        model,
        outputUrl,
        metadata: {
          aspect_ratio: aspectRatio,
          duration_seconds: normalizedDuration,
          provider_response: result.rawResponse,
        },
      });

      return { type: "project" as const, asset, outputUrl };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("quick_generations")
      .insert({
        user_id: userId,
        type: "video",
        prompt: normalizedPrompt,
        model,
        output_url: outputUrl,
        status: "completed",
        aspect_ratio: aspectRatio,
        duration_seconds: normalizedDuration,
        quantity: 1,
        reference_file_name: referenceAsset?.name ?? null,
        metadata: { provider_response: result.rawResponse },
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { type: "quick" as const, generation: data, outputUrl };
  } catch (error) {
    if (!projectId) {
      const supabase = await createClient();
      await supabase.from("quick_generations").insert({
        user_id: userId,
        type: "video",
        prompt: normalizedPrompt,
        model,
        output_url: null,
        status: "failed",
        aspect_ratio: aspectRatio,
        duration_seconds: normalizedDuration,
        quantity: 1,
        reference_file_name: referenceAsset?.name ?? null,
        error_message: error instanceof Error ? error.message : "Tạo video thất bại.",
      });
    }

    await refundCredits({
      userId,
      amount: creditCost,
      reason: "Hoàn tín dụng do tạo video thất bại",
      referenceType: "video_generation_refund",
      referenceId,
      metadata: { project_id: projectId ?? null, model },
    });

    throw error;
  }
}
