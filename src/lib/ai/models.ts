/**
 * AI model registry used by the app UI and route validation.
 */

export const TEXT_MODELS = [
  "gpt-4o-mini",
  "gpt-4.1",
  "gemini-2.5-pro",
  "gemini-2.5-flash",
] as const;

export type TextModel = (typeof TEXT_MODELS)[number];

export const IMAGE_MODELS = [
  {
    id: "gemini/gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image Preview",
  },
  {
    id: "gemini/gemini-3-pro-image-preview",
    label: "Gemini 3 Pro Image Preview",
  },
  {
    id: "gemini/gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
  },
] as const;

export type ImageModel = (typeof IMAGE_MODELS)[number]["id"];

export const VIDEO_MODELS = [
  { id: "veo-3", label: "Veo 3 (Google)" },
  { id: "veo-3-fast", label: "Veo 3 Fast (Google)" },
  { id: "veo", label: "Veo (Google)" },
] as const;

export type VideoModel = (typeof VIDEO_MODELS)[number]["id"];

export const VIDEO_DURATIONS = [5, 8, 10, 15, 30] as const;

export type VideoDuration = (typeof VIDEO_DURATIONS)[number];

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;

export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export type AnyModel = TextModel | ImageModel | VideoModel;

export const MODEL_LABELS: Record<string, string> = {
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4.1": "GPT-4.1",
  "gemini-2.5-pro": "Gemini 2.5 Pro",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "gemini/gemini-3.1-flash-image-preview": "Gemini 3.1 Flash Image Preview",
  "gemini/gemini-3-pro-image-preview": "Gemini 3 Pro Image Preview",
  "gemini/gemini-2.5-flash-image": "Gemini 2.5 Flash Image",
  "veo-3": "Veo 3",
  "veo-3-fast": "Veo 3 Fast",
  veo: "Veo",
};

export function isAspectRatio(value: unknown): value is AspectRatio {
  return ASPECT_RATIOS.includes(value as AspectRatio);
}

export function isVideoModel(value: unknown): value is VideoModel {
  return VIDEO_MODELS.some((model) => model.id === value);
}

export function isImageModel(value: unknown): value is ImageModel {
  return IMAGE_MODELS.some((model) => model.id === value);
}

export function isVideoDuration(value: unknown): value is VideoDuration {
  return VIDEO_DURATIONS.includes(value as VideoDuration);
}
