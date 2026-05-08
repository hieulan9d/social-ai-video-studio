/**
 * AI Models Registry
 * Danh sách model dùng trong Social AI Video Studio
 * Chỉ dùng OpenAI/ChatGPT và Google/Gemini qua 9Router
 */

// ── Text models ──────────────────────────────────────────────
export const TEXT_MODELS = [
  "gpt-4o-mini",
  "gpt-4.1",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
] as const;

export type TextModel = (typeof TEXT_MODELS)[number];

// ── Image models — dạng object {id, label} ───────────────────
export const IMAGE_MODELS = [
  { id: "gpt-image-1", label: "GPT Image 1 (OpenAI)" },
  { id: "gpt-image",   label: "GPT Image (OpenAI)" },
] as const;

export type ImageModel = (typeof IMAGE_MODELS)[number]["id"];

// ── Video models — dạng object {id, label} ───────────────────
export const VIDEO_MODELS = [
  { id: "veo-3",      label: "Veo 3 (Google)" },
  { id: "veo-3-fast", label: "Veo 3 Fast (Google, nhanh)" },
  { id: "veo",        label: "Veo (Google)" },
] as const;

export type VideoModel = (typeof VIDEO_MODELS)[number]["id"];

// ── Video durations — số giây ────────────────────────────────
export const VIDEO_DURATIONS = [5, 8, 10, 15, 30] as const;

export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

// ── Aspect ratios — string thuần ─────────────────────────────
export const ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number];

// ── Misc ─────────────────────────────────────────────────────
export type AnyModel = TextModel | ImageModel | VideoModel;

export const MODEL_LABELS: Record<string, string> = {
  "gpt-4o-mini":      "GPT-4o Mini (nhanh, tiết kiệm)",
  "gpt-4.1":          "GPT-4.1 (chất lượng cao)",
  "gemini-2.5-pro":   "Gemini 2.5 Pro (Google)",
  "gemini-2.5-flash": "Gemini 2.5 Flash (Google, nhanh)",
  "gpt-image-1":      "GPT Image 1 (tạo ảnh)",
  "gpt-image":        "GPT Image (tạo ảnh)",
  "veo-3":            "Veo 3 (tạo video Google)",
  "veo-3-fast":       "Veo 3 Fast (tạo video nhanh)",
  "veo":              "Veo (Google)",
};

// ── Type guards ───────────────────────────────────────────────
export function isAspectRatio(value: unknown): value is AspectRatio {
  return ASPECT_RATIOS.includes(value as AspectRatio);
}

export function isVideoModel(value: unknown): value is VideoModel {
  return VIDEO_MODELS.some((m) => m.id === value);
}

export function isImageModel(value: unknown): value is ImageModel {
  return IMAGE_MODELS.some((m) => m.id === value);
}

export function isVideoDuration(value: unknown): value is VideoDuration {
  return VIDEO_DURATIONS.includes(value as VideoDuration);
}
