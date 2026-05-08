export const IMAGE_MODELS = [
  { id: "gpt-image", label: "GPT Image" },
  { id: "flux", label: "Flux" },
  { id: "recraft", label: "Recraft" },
  { id: "imagen", label: "Imagen" },
] as const;

export const VIDEO_MODELS = [
  { id: "veo", label: "Veo" },
  { id: "kling", label: "Kling" },
  { id: "runway", label: "Runway" },
] as const;

export const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;
export const VIDEO_DURATIONS = [5, 8, 10, 15] as const;

export type ImageModel = (typeof IMAGE_MODELS)[number]["id"];
export type VideoModel = (typeof VIDEO_MODELS)[number]["id"];
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export function isImageModel(value: string): value is ImageModel {
  return IMAGE_MODELS.some((model) => model.id === value);
}

export function isVideoModel(value: string): value is VideoModel {
  return VIDEO_MODELS.some((model) => model.id === value);
}

export function isAspectRatio(value: string): value is AspectRatio {
  return ASPECT_RATIOS.includes(value as AspectRatio);
}
