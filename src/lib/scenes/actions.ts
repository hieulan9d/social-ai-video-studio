"use server";

import { revalidatePath } from "next/cache";
import { requireUserProfile } from "@/lib/auth/server";
import { getAITextProvider } from "@/lib/ai/providers";
import type { GeneratedScript } from "@/lib/ai/types";
import { getProjectDetail, replaceScenesForProject } from "@/lib/projects/server";
import { deductCredits, refundCredits } from "@/lib/wallet/server";

const SCENE_GENERATION_CREDIT_COST = 1;
const DURATION_TOLERANCE_SECONDS = 2;

type EditableScene = {
  sceneNumber: number;
  durationSeconds: number;
  visualDescription: string;
  cameraAngle: string;
  cameraMovement: string;
  subjectAction: string;
  background: string;
  lighting: string;
  voiceover: string;
  onScreenText: string;
  notes: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScenes(rawScenes: EditableScene[]) {
  return rawScenes.map((scene, index) => ({
    sceneOrder: index + 1,
    durationSeconds: Math.max(1, Math.trunc(scene.durationSeconds || 0)),
    visualDescription: scene.visualDescription.trim(),
    cameraAngle: scene.cameraAngle.trim(),
    cameraMovement: scene.cameraMovement.trim(),
    subjectAction: scene.subjectAction.trim(),
    background: scene.background.trim(),
    lighting: scene.lighting.trim(),
    voiceover: scene.voiceover.trim(),
    onScreenText: scene.onScreenText.trim(),
    notes: scene.notes.trim(),
  }));
}

function validateTotalDuration(
  scenes: Array<{ durationSeconds: number }>,
  targetDuration: number,
) {
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);

  if (Math.abs(totalDuration - targetDuration) > DURATION_TOLERANCE_SECONDS) {
    throw new Error(
      `Total scene duration must be within ${DURATION_TOLERANCE_SECONDS}s of the project target duration.`,
    );
  }
}

export async function generateScenesAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");

  if (!projectId) {
    throw new Error("Project is required.");
  }

  const detail = await getProjectDetail(projectId, user.id);

  if (!detail) {
    throw new Error("Project not found.");
  }

  if (!detail.script) {
    throw new Error("Generate a script before generating scenes.");
  }

  const referenceId = `${projectId}:scene:${Date.now()}`;

  await deductCredits({
    userId: user.id,
    amount: SCENE_GENERATION_CREDIT_COST,
    reason: "AI scene breakdown generation",
    referenceType: "scene_generation",
    referenceId,
    metadata: {
      project_id: projectId,
    },
  });

  try {
    const generatedOutput = detail.script.generated_output as Partial<GeneratedScript>;
    const provider = getAITextProvider();
    const scenes = await provider.generateSceneBreakdown({
      context: {
        platform: detail.project.platform,
        duration: detail.project.duration,
        style: detail.project.style || "Modern social ad",
        language: detail.project.language,
        productType: detail.script.product_type || "General offer",
        idea: detail.script.idea || detail.project.brief || "",
      },
      script: {
        videoTitle: detail.script.title || detail.project.title,
        hook: detail.script.hook || "",
        targetAudience: detail.script.target_audience || "",
        problem: detail.script.problem || "",
        solution: detail.script.solution || "",
        productService:
          typeof generatedOutput.productService === "string"
            ? generatedOutput.productService
            : "",
        cta: detail.script.cta || "",
        voiceover: detail.script.voiceover || detail.script.content || "",
      },
    });

    const normalizedScenes = normalizeScenes(
      scenes.map((scene) => ({
        sceneNumber: scene.sceneNumber,
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

    validateTotalDuration(normalizedScenes, detail.project.duration);
    await replaceScenesForProject(projectId, normalizedScenes);

    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    await refundCredits({
      userId: user.id,
      amount: SCENE_GENERATION_CREDIT_COST,
      reason: "Refund for failed AI scene breakdown generation",
      referenceType: "scene_generation_refund",
      referenceId,
      metadata: {
        project_id: projectId,
      },
    });

    throw error;
  }
}

export async function saveScenesAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const rawScenes = readString(formData, "scenes");

  if (!projectId || !rawScenes) {
    throw new Error("Project and scenes are required.");
  }

  const detail = await getProjectDetail(projectId, user.id);

  if (!detail) {
    throw new Error("Project not found.");
  }

  const parsed = JSON.parse(rawScenes) as EditableScene[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("At least one scene is required.");
  }

  const normalizedScenes = normalizeScenes(parsed);
  validateTotalDuration(normalizedScenes, detail.project.duration);
  await replaceScenesForProject(projectId, normalizedScenes);

  revalidatePath(`/projects/${projectId}`);
}
