export const FEATURE_PRICE_KEYS = [
  "text_generation",
  "scene_generation",
  "prompt_generation",
  "veo_render",
  "image_to_video",
  "transition_video",
  "export",
] as const;

export type FeaturePriceKey = (typeof FEATURE_PRICE_KEYS)[number];

export type FeaturePriceRecord = {
  id: string;
  feature_key: FeaturePriceKey;
  name: string;
  description: string | null;
  credit_cost: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function isFeaturePriceKey(value: string): value is FeaturePriceKey {
  return FEATURE_PRICE_KEYS.includes(value as FeaturePriceKey);
}
