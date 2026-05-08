/**
 * Model Router
 * Map task → model dựa trên biến môi trường
 * Có fallback nếu env thiếu
 */

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

export function getModelByTask(task: AITask): string {
  const envKey = ENV_MAP[task];
  const envValue = process.env[envKey];
  return envValue || FALLBACKS[task];
}

/** Lấy toàn bộ config model hiện tại (dùng cho Admin Settings) */
export function getAllModelConfig(): Record<string, string> {
  const tasks = Object.keys(ENV_MAP) as AITask[];
  return tasks.reduce((acc, task) => {
    acc[task] = getModelByTask(task);
    return acc;
  }, {} as Record<string, string>);
}
