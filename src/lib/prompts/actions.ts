"use server";

import { revalidatePath } from "next/cache";
import { requireUserProfile } from "@/lib/auth/server";
import { generatePromptForScene } from "@/lib/ai/server";
import type { GeneratedScript } from "@/lib/ai/types";
import {
  getProjectDetail,
  replacePromptsForProject,
  upsertPromptRecord,
} from "@/lib/projects/server";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { deductCredits, refundCredits } from "@/lib/wallet/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildConsistencyInstruction(detail: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>) {
  const hasProductImage = detail.assets.some(
    (asset) => asset.asset_type === "product_image" || asset.asset_type === "logo",
  );

  if (!hasProductImage) {
    return undefined;
  }

  const productType = detail.script?.product_type || "product";

  return `Maintain strict ${productType} consistency across the whole video: preserve the same packaging shape, exact product proportions, logo placement, label layout, brand colors, cap style, and overall product identity. Do not invent alternate labels or brand marks.`;
}

function buildScriptForPrompt(detail: NonNullable<Awaited<ReturnType<typeof getProjectDetail>>>) {
  const generatedOutput = detail.script?.generated_output as
    | {
        productService?: string;
      }
    | undefined;

  return {
    videoTitle: detail.script?.title || detail.project.title,
    hook: detail.script?.hook || "",
    targetAudience: detail.script?.target_audience || "",
    problem: detail.script?.problem || "",
    solution: detail.script?.solution || "",
    productService:
      typeof generatedOutput?.productService === "string"
        ? generatedOutput.productService
        : detail.script?.product_type || "",
    cta: detail.script?.cta || "",
    voiceover: detail.script?.voiceover || detail.script?.content || "",
  } satisfies Omit<GeneratedScript, "scenes">;
}

export async function generateAllPromptsAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");

  if (!projectId) {
    throw new Error("Vui long chon du an.");
  }

  const detail = await getProjectDetail(projectId, user.id);

  if (!detail) {
    throw new Error("Khong tim thay du an.");
  }

  if (!detail.script) {
    throw new Error("Hay tao kich ban truoc khi tao prompt.");
  }

  if (detail.scenes.length === 0) {
    throw new Error("Hay tao canh truoc khi tao prompt.");
  }

  const consistencyInstruction = buildConsistencyInstruction(detail);
  const script = buildScriptForPrompt(detail);
  const creditCost = await getFeatureCreditCost("prompt_generation");
  const referenceId = `${projectId}:prompts:${Date.now()}`;
  const context = {
    platform: detail.project.platform,
    duration: detail.project.duration,
    style: detail.project.style || "Quang cao social hien dai",
    language: detail.project.language,
    productType: detail.script.product_type || "product",
    idea: detail.script.idea || detail.project.brief || "",
  };

  if (creditCost > 0) {
    await deductCredits({
      userId: user.id,
      amount: creditCost,
      reason: "Tao prompt AI",
      referenceType: "prompt_generation",
      referenceId,
      metadata: {
        project_id: projectId,
        scene_count: detail.scenes.length,
      },
    });
  }

  try {
    const generatedPrompts = await Promise.all(
      detail.scenes.map(async (scene) => {
        const prompt = await generatePromptForScene({
          scene: {
            sceneNumber: scene.scene_order,
            durationSeconds: scene.duration_seconds || 1,
            visualDescription: scene.visual_description || "",
            cameraAngle: scene.camera_angle || "",
            cameraMovement: scene.camera_movement || "",
            subjectAction: scene.subject_action || "",
            background: scene.background || "",
            lighting: scene.lighting || "",
            voiceScript: scene.voiceover || "",
            onScreenText: scene.on_screen_text || "",
            notes: scene.notes || "",
          },
          context,
          script,
          consistencyInstruction,
        });

        return {
          sceneId: scene.id,
          promptType: prompt.promptType,
          content: prompt.content,
        };
      }),
    );

    await replacePromptsForProject(projectId, generatedPrompts);
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    if (creditCost > 0) {
      await refundCredits({
        userId: user.id,
        amount: creditCost,
        reason: "Hoan tin dung do tao prompt AI that bai",
        referenceType: "prompt_generation_refund",
        referenceId,
        metadata: {
          project_id: projectId,
        },
      });
    }

    throw error;
  }
}

export async function regeneratePromptAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const sceneId = readString(formData, "sceneId");

  if (!projectId || !sceneId) {
    throw new Error("Vui long cung cap du an va canh.");
  }

  const detail = await getProjectDetail(projectId, user.id);

  if (!detail || !detail.script) {
    throw new Error("Khong tim thay du an hoac kich ban.");
  }

  const scene = detail.scenes.find((item) => item.id === sceneId);

  if (!scene) {
    throw new Error("Khong tim thay canh.");
  }

  const creditCost = await getFeatureCreditCost("prompt_generation");
  const referenceId = `${projectId}:prompt:${sceneId}:${Date.now()}`;

  if (creditCost > 0) {
    await deductCredits({
      userId: user.id,
      amount: creditCost,
      reason: "Tao lai prompt AI",
      referenceType: "prompt_generation",
      referenceId,
      metadata: {
        project_id: projectId,
        scene_id: sceneId,
      },
    });
  }

  try {
    const prompt = await generatePromptForScene({
      scene: {
        sceneNumber: scene.scene_order,
        durationSeconds: scene.duration_seconds || 1,
        visualDescription: scene.visual_description || "",
        cameraAngle: scene.camera_angle || "",
        cameraMovement: scene.camera_movement || "",
        subjectAction: scene.subject_action || "",
        background: scene.background || "",
        lighting: scene.lighting || "",
        voiceScript: scene.voiceover || "",
        onScreenText: scene.on_screen_text || "",
        notes: scene.notes || "",
      },
      context: {
        platform: detail.project.platform,
        duration: detail.project.duration,
        style: detail.project.style || "Quang cao social hien dai",
        language: detail.project.language,
        productType: detail.script.product_type || "product",
        idea: detail.script.idea || detail.project.brief || "",
      },
      script: buildScriptForPrompt(detail),
      consistencyInstruction: buildConsistencyInstruction(detail),
    });

    await upsertPromptRecord({
      projectId,
      sceneId,
      promptType: prompt.promptType,
      content: prompt.content,
    });

    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    if (creditCost > 0) {
      await refundCredits({
        userId: user.id,
        amount: creditCost,
        reason: "Hoan tin dung do tao lai prompt AI that bai",
        referenceType: "prompt_generation_refund",
        referenceId,
        metadata: {
          project_id: projectId,
          scene_id: sceneId,
        },
      });
    }

    throw error;
  }
}

export async function savePromptsAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const rawPrompts = readString(formData, "prompts");

  if (!projectId || !rawPrompts) {
    throw new Error("Vui long cung cap du an va prompt.");
  }

  const detail = await getProjectDetail(projectId, user.id);

  if (!detail) {
    throw new Error("Khong tim thay du an.");
  }

  const parsed = JSON.parse(rawPrompts) as Array<{
    sceneId: string | null;
    promptType: string;
    content: string;
  }>;

  await replacePromptsForProject(
    projectId,
    parsed.map((item) => ({
      sceneId: item.sceneId,
      promptType: item.promptType,
      content: item.content.trim(),
    })),
  );

  revalidatePath(`/projects/${projectId}`);
}
