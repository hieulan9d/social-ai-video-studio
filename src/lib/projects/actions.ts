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
    throw new Error("Vui lòng nhập tiêu đề dự án.");
  }

  if (!PROJECT_PLATFORMS.includes(platform as (typeof PROJECT_PLATFORMS)[number])) {
    throw new Error("Nền tảng dự án không hợp lệ.");
  }

  if (
    !PROJECT_VIDEO_TYPES.includes(
      videoType as (typeof PROJECT_VIDEO_TYPES)[number],
    )
  ) {
    throw new Error("Loại video không hợp lệ.");
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Thời lượng phải là số dương.");
  }

  if (!language) {
    throw new Error("Vui lòng nhập ngôn ngữ.");
  }

  if (!PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
    throw new Error("Trạng thái dự án không hợp lệ.");
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
    throw new Error("Thiếu ID dự án.");
  }

  await deleteProjectRecord(projectId, user.id);
  revalidatePath("/projects");
  redirect("/projects");
}
