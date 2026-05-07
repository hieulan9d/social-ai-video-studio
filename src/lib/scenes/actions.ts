"use server";

import { revalidatePath } from "next/cache";
import { requireUserProfile } from "@/lib/auth/server";
import { getAITextProvider } from "@/lib/ai/providers";
import type { GeneratedScript } from "@/lib/ai/types";
import { getProjectDetail, replaceScenesForProject } from "@/lib/projects/server";
import { getFeatureCreditCost } from "@/lib/pricing/server";
import { deductCredits, refundCredits } from "@/lib/wallet/server";

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
    throw new Error("Vui lòng chọn dự án.");
  }

  const detail = await getProjectDetail(projectId, user.id);

  if (!detail) {
    throw new Error("Không tìm thấy dự án.");
  }

  if (!detail.script) {
    throw new Error("Hãy tạo kịch bản trước khi tạo cảnh.");
  }

  const referenceId = `${projectId}:scene:${Date.now()}`;
  const creditCost = await getFeatureCreditCost("scene_generation");

  await deductCredits({
    userId: user.id,
    amount: creditCost,
    reason: "Tạo tách cảnh bằng AI",
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
        style: detail.project.style || "Quảng cáo social hiện đại",
        language: detail.project.language,
        productType: detail.script.product_type || "Ưu đãi chung",
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
      amount: creditCost,
      reason: "Hoàn tín dụng do tạo tách cảnh AI thất bại",
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
    throw new Error("Vui lòng cung cấp dự án và danh sách cảnh.");
  }

  const detail = await getProjectDetail(projectId, user.id);

  if (!detail) {
    throw new Error("Không tìm thấy dự án.");
  }

  const parsed = JSON.parse(rawScenes) as EditableScene[];

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Cần có ít nhất một cảnh.");
  }

  const normalizedScenes = normalizeScenes(parsed);
  validateTotalDuration(normalizedScenes, detail.project.duration);
  await replaceScenesForProject(projectId, normalizedScenes);

  revalidatePath(`/projects/${projectId}`);
}
