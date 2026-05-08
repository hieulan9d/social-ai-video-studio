/**
 * AI Module - Barrel export
 * Import từ "@/lib/ai" để dùng các service
 */

export { generateText } from "./text";
export type { GenerateTextParams, GenerateTextResult } from "./text";

export { generateImage } from "./image";
export type { GenerateImageParams, GenerateImageResult } from "./image";

export { generateVideo } from "./video";
export type { GenerateVideoParams, GenerateVideoResult, VideoMode } from "./video";

export { getModelByTask, getAllModelConfig } from "./model-router";
export type { AITask } from "./model-router";

export { TEXT_MODELS, IMAGE_MODELS, VIDEO_MODELS, MODEL_LABELS } from "./models";
