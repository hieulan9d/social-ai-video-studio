"use server";

import { revalidatePath } from "next/cache";
import { requireUserProfile } from "@/lib/auth/server";
import {
  createImageToVideoRender,
  createStartEndTransitionRender,
  createTextToVideoRender,
  syncRenderJob,
} from "@/lib/render/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function startTextToVideoRenderAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const promptId = readString(formData, "promptId");

  if (!projectId || !promptId) {
    throw new Error("Project and prompt are required.");
  }

  await createTextToVideoRender({
    projectId,
    promptId,
    userId: user.id,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/render-history");
}

export async function startImageToVideoRenderAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const assetId = readString(formData, "assetId");
  const motionStyle = readString(formData, "motionStyle");
  const prompt = readString(formData, "prompt");
  const durationSeconds = Number.parseInt(readString(formData, "durationSeconds"), 10);

  if (!projectId || !assetId || !motionStyle || !prompt) {
    throw new Error("Project, image, motion style, and prompt are required.");
  }

  await createImageToVideoRender({
    projectId,
    assetId,
    userId: user.id,
    motionStyle,
    durationSeconds,
    prompt,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/render-history");
}

export async function startEndTransitionRenderAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");
  const startAssetId = readString(formData, "startAssetId");
  const endAssetId = readString(formData, "endAssetId");
  const transitionStyle = readString(formData, "transitionStyle");
  const prompt = readString(formData, "prompt");
  const durationSeconds = Number.parseInt(readString(formData, "durationSeconds"), 10);

  if (!projectId || !startAssetId || !endAssetId || !transitionStyle || !prompt) {
    throw new Error(
      "Project, start image, end image, transition style, and prompt are required.",
    );
  }

  await createStartEndTransitionRender({
    projectId,
    startAssetId,
    endAssetId,
    userId: user.id,
    transitionStyle,
    durationSeconds,
    prompt,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/render-history");
}

export async function syncRenderJobAction(formData: FormData) {
  const user = await requireUserProfile();
  const renderJobId = readString(formData, "renderJobId");
  const projectId = readString(formData, "projectId");

  if (!renderJobId) {
    throw new Error("Render job is required.");
  }

  await syncRenderJob(renderJobId, user.id);

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }

  revalidatePath("/render-history");
}
