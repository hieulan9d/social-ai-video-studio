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
    throw new Error("Prompt phải có ít nhất 3 ký tự.");
  }

  const normalizedDuration = Math.min(30, Math.max(1, Math.trunc(duration || 5)));
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

  await deductCredits({
    userId,
    amount: creditCost,
    reason: projectId ? "Tạo video trong dự án" : "Tạo video nhanh",
    referenceType: "video_generation",
    referenceId,
    metadata: {
      project_id: projectId ?? null,
      model,
      duration: normalizedDuration,
      video_mode: resolvedVideoMode,
    },
  });

  try {
    const result = await generateVideoWithNineRouter({
      prompt: normalizedPrompt,
      model,
      duration: normalizedDuration,
      aspectRatio,
      referenceAsset,
      startImage,
      endImage,
      startImageUrl,
      endImageUrl,
      videoMode: resolvedVideoMode,
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
          video_mode: resolvedVideoMode,
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
        reference_file_name:
          referenceAsset?.name ?? startImage?.name ?? endImage?.name ?? null,
        metadata: {
          provider_response: result.rawResponse,
          video_mode: resolvedVideoMode,
          start_image_file_name: startImage?.name ?? null,
          end_image_file_name: endImage?.name ?? null,
          start_image_url: startImageUrl ?? null,
          end_image_url: endImageUrl ?? null,
        },
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
        reference_file_name:
          referenceAsset?.name ?? startImage?.name ?? endImage?.name ?? null,
        metadata: {
          video_mode: resolvedVideoMode,
          start_image_file_name: startImage?.name ?? null,
          end_image_file_name: endImage?.name ?? null,
          start_image_url: startImageUrl ?? null,
          end_image_url: endImageUrl ?? null,
        },
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
