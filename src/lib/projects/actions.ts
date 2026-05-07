"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/auth/server";
import {
  createProject as createProjectRecord,
  deleteProject as deleteProjectRecord,
} from "@/lib/projects/server";
import {
  PROJECT_PLATFORMS,
  PROJECT_STATUSES,
  PROJECT_VIDEO_TYPES,
} from "@/lib/projects/types";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createProjectAction(formData: FormData) {
  const user = await requireUserProfile();
  const title = readString(formData, "title");
  const platform = readString(formData, "platform");
  const videoType = readString(formData, "videoType");
  const duration = Number.parseInt(readString(formData, "duration"), 10);
  const style = readString(formData, "style");
  const language = readString(formData, "language");
  const status = readString(formData, "status");
  const brief = readString(formData, "brief");

  if (!title) {
    throw new Error("Project title is required.");
  }

  if (!PROJECT_PLATFORMS.includes(platform as (typeof PROJECT_PLATFORMS)[number])) {
    throw new Error("Invalid project platform.");
  }

  if (
    !PROJECT_VIDEO_TYPES.includes(
      videoType as (typeof PROJECT_VIDEO_TYPES)[number],
    )
  ) {
    throw new Error("Invalid video type.");
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Duration must be a positive number.");
  }

  if (!language) {
    throw new Error("Language is required.");
  }

  if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
    throw new Error("Invalid project status.");
  }

  const project = await createProjectRecord({
    userId: user.id,
    title,
    platform: platform as (typeof PROJECT_PLATFORMS)[number],
    videoType: videoType as (typeof PROJECT_VIDEO_TYPES)[number],
    duration,
    style: style || null,
    language,
    status: status as (typeof PROJECT_STATUSES)[number],
    brief: brief || null,
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireUserProfile();
  const projectId = readString(formData, "projectId");

  if (!projectId) {
    throw new Error("Project id is required.");
  }

  await deleteProjectRecord(projectId, user.id);
  revalidatePath("/projects");
  redirect("/projects");
}
