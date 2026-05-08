import "server-only";

import { getRoutedModelCandidates } from "@/lib/ai/smart-routing";

export type AITask =
  | "chat"
  | "prompt"
  | "script"
  | "reasoning"
  | "gemini_text"
  | "gemini_fast"
  | "image"
  | "video"
  | "video_fast";

const FALLBACKS: Record<AITask, string> = {
  chat: "gpt-4o-mini",
  prompt: "gpt-4o-mini",
  script: "gpt-4.1",
  reasoning: "gpt-4.1",
  gemini_text: "gemini-2.5-pro",
  gemini_fast: "gemini-2.5-flash",
  image: "gpt-image-1",
  video: "veo-3",
  video_fast: "veo-3-fast",
};

const ENV_MAP: Record<AITask, string> = {
  chat: "AI_DEFAULT_TEXT_MODEL",
  prompt: "AI_PROMPT_MODEL",
  script: "AI_SCRIPT_MODEL",
  reasoning: "AI_REASONING_MODEL",
  gemini_text: "AI_GEMINI_TEXT_MODEL",
  gemini_fast: "AI_GEMINI_FAST_MODEL",
  image: "AI_IMAGE_MODEL",
  video: "AI_VIDEO_MODEL",
  video_fast: "AI_VIDEO_FAST_MODEL",
};

export function getConfiguredModelByTask(task: AITask): string {
  const envKey = ENV_MAP[task];
  const envValue = process.env[envKey];
  return envValue || FALLBACKS[task];
}

export async function getModelByTask(task: AITask): Promise<string> {
  const { models } = await getRoutedModelCandidates({
    task,
    requestedModel: getConfiguredModelByTask(task),
  });

  return models[0] ?? getConfiguredModelByTask(task);
}

export async function getModelCandidatesByTask(task: AITask) {
  return getRoutedModelCandidates({
    task,
    requestedModel: getConfiguredModelByTask(task),
  });
}

export async function getAllModelConfig(): Promise<Record<string, string>> {
  const tasks = Object.keys(ENV_MAP) as AITask[];
  const entries = await Promise.all(
    tasks.map(async (task) => [task, await getModelByTask(task)] as const),
  );

  return Object.fromEntries(entries);
}
