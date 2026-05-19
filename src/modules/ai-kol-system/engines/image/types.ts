import type { JsonData } from '../../types';

/**
 * Image Generation Engine — Phase 5 Types
 */

export type ImageGenerationMode =
  | 'character_reference'
  | 'product_reference'
  | 'outfit_transfer'
  | 'product_injection'
  | 'scene_asset';

export type ImageGenerationInput = {
  kolId: string;
  campaignId?: string;
  mode: ImageGenerationMode;
  prompt: string;
  referenceImageUrl?: string;
  settings: ImageGenerationSettings;
  metadata?: JsonData;
};

export type ImageGenerationSettings = {
  width: number;
  height: number;
  quality: 'draft' | 'standard' | 'high';
  style?: string;
  seed?: number;
  guidanceScale?: number;
  steps?: number;
  negativePrompt?: string;
  preserveFace?: boolean;
  preserveBody?: boolean;
  preserveProduct?: boolean;
};

export type ImageGenerationResult = {
  id: string;
  imageUrl: string;
  storagePath: string;
  width: number;
  height: number;
  mode: ImageGenerationMode;
  provider: string;
  model: string;
  generationTime: number;
  metadata: JsonData;
};

export type ImageQueueJob = {
  id: string;
  kolId: string;
  campaignId?: string;
  mode: ImageGenerationMode;
  input: ImageGenerationInput;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  priority: number;
  result?: ImageGenerationResult;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type CharacterReferenceConfig = {
  angles: ('front' | 'side' | 'three_quarter' | 'back')[];
  includeFullBody: boolean;
  includeCloseUp: boolean;
  includeExpressions: boolean;
  expressions?: string[];
};

export type ProductReferenceConfig = {
  preserveLogo: boolean;
  preservePackaging: boolean;
  angles: ('front' | 'side' | 'top' | 'perspective')[];
  includeInHand: boolean;
};

export type OutfitTransferConfig = {
  preserveFaceIdentity: boolean;
  preserveBodyProportions: boolean;
  replaceClothingOnly: boolean;
  outfitImageUrl: string;
};

export type ProductInjectionConfig = {
  realisticHandPlacement: boolean;
  realisticShadows: boolean;
  preserveExactLogo: boolean;
  preservePackagingColors: boolean;
  productImageUrl: string;
};

export type SceneAssetConfig = {
  environment: string;
  lighting: string;
  mood: string;
  timeOfDay?: string;
  includeProps?: string[];
};

export const DEFAULT_IMAGE_SETTINGS: ImageGenerationSettings = {
  width: 1024,
  height: 1024,
  quality: 'standard',
  negativePrompt: 'blurry, low quality, distorted, watermark',
};
