"use server";

import { revalidatePath } from "next/cache";
import { requireUserProfile } from "@/lib/auth/server";
import { generateFullScript } from "@/lib/ai/server";
import { getAITextProviderMetadata } from "@/lib/ai/providers";
import {
  getProjectById,
  replacePromptsForProject,
  replaceScenesForProject,
  updateProject,
  upsertScriptRecord,
} from "@/lib/projects/server";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { addCredits, deductCredits, refundCredits } from "@/lib/wallet/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function generateScriptAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const idea = readString(formData, "idea");
  const productType = readString(formData, "productType");

  if (!projectId || !idea || !productType) {
    throw new Error("Vui long cung cap du an, y tuong va loai san pham.");
  }

  const project = await getProjectById(projectId, user.id);

  if (!project) {
    throw new Error("Khong tim thay du an.");
  }

  const referenceId = `${projectId}:${Date.now()}`;
  const creditCost = await getFeatureCreditCost("text_generation");

  if (creditCost > 0) {
    await deductCredits({
      userId: user.id,
      amount: creditCost,
      reason: "Tao kich ban AI",
      referenceType: "script_generation",
      referenceId,
      metadata: {
        project_id: projectId,
      },
    });
  }

  try {
    const providerMetadata = getAITextProviderMetadata();
    const result = await generateFullScript({
      platform: project.platform,
      duration: project.duration,
      style: project.style || "Quang cao social hien dai",
      language: project.language,
      productType,
      idea,
    });

    await upsertScriptRecord({
      projectId,
      title: result.videoTitle,
      idea,
      productType,
      content: result.voiceover,
      hook: result.hook,
      problem: result.problem,
      solution: result.solution,
      targetAudience: result.targetAudience,
      voiceover: result.voiceover,
      cta: result.cta,
      generationInput: {
        idea,
        productType,
        platform: project.platform,
        duration: project.duration,
        style: project.style,
        language: project.language,
      },
      generatedOutput: result,
      provider: providerMetadata.provider,
      model: providerMetadata.model,
      version: project.status === "script_ready" ? 2 : 1,
    });

    const savedScenes = await replaceScenesForProject(
      projectId,
      result.scenes.map((scene) => ({
        sceneOrder: scene.sceneNumber,
        durationSeconds: scene.durationSeconds,
        visualDescription: scene.visualDescription,
        cameraAngle: scene.cameraAngle,
        cameraMovement: scene.cameraMovement,
        subjectAction: scene.subjectAction,
        background: scene.background,
        lighting: scene.lighting,
        voiceover: scene.voiceScript,
        onScreenText: scene.onScreenText,
        notes: scene.notes,
      })),
    );

    await replacePromptsForProject(
      projectId,
      result.prompts.map((prompt) => ({
        sceneId:
          savedScenes.find((scene) => scene.scene_order === prompt.sceneOrder)?.id ?? null,
        promptType: prompt.promptType,
        content: prompt.content,
      })),
    );

    await updateProject({
      projectId,
      userId: user.id,
      title: result.videoTitle || project.title,
      status: "script_ready",
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/projects");
  } catch (error) {
    if (creditCost > 0) {
      await refundCredits({
        userId: user.id,
        amount: creditCost,
        reason: "Hoan tin dung do tao kich ban AI that bai",
        referenceType: "script_generation_refund",
        referenceId,
        metadata: {
          project_id: projectId,
        },
      });
    }

    throw error;
  }
}

export async function updateScriptAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");

  if (!projectId) {
    throw new Error("Vui long chon du an.");
  }

  const project = await getProjectById(projectId, user.id);

  if (!project) {
    throw new Error("Khong tim thay du an.");
  }

  const title = readString(formData, "title");
  const idea = readString(formData, "idea");
  const productType = readString(formData, "productType");
  const hook = readString(formData, "hook");
  const targetAudience = readString(formData, "targetAudience");
  const problem = readString(formData, "problem");
  const solution = readString(formData, "solution");
  const productService = readString(formData, "productService");
  const voiceover = readString(formData, "voiceover");
  const cta = readString(formData, "cta");

  await upsertScriptRecord({
    projectId,
    title,
    idea,
    productType,
    content: voiceover,
    hook,
    problem,
    solution,
    targetAudience,
    voiceover,
    cta,
    generationInput: {
      idea,
      productType,
      platform: project.platform,
      duration: project.duration,
      style: project.style,
      language: project.language,
    },
    generatedOutput: {
      videoTitle: title,
      hook,
      targetAudience,
      problem,
      solution,
      productService,
      cta,
      voiceover,
    },
    provider: "manual-edit",
    model: "manual",
  });

  await updateProject({
    projectId,
    userId: user.id,
    title,
    status: "script_ready",
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function addManualScriptCredits(formData: FormData) {
  const user = await requireUserProfile();
  const amount = Number.parseInt(readString(formData, "amount"), 10);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("So tin dung nap thu khong hop le.");
  }

  await addCredits({
    userId: user.id,
    amount,
    reason: "Nap thu tin dung thu cong cho kich ban",
    referenceType: "manual_topup",
    referenceId: `${user.id}:${Date.now()}`,
  });

  revalidatePath("/wallet");
  revalidatePath("/dashboard");
}
