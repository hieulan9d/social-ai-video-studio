import type { FeaturePriceKey, FeaturePriceRecord } from "@/lib/pricing/types";

const FREE_FEATURE_KEYS = new Set<FeaturePriceKey>([
  "text_generation",
  "scene_generation",
  "prompt_generation",
  "export",
]);

const DEFAULT_FEATURE_CREDIT_COST: Record<FeaturePriceKey, number> = {
  text_generation: 0,
  scene_generation: 0,
  prompt_generation: 0,
  veo_render: 5,
  image_to_video: 5,
  transition_video: 5,
  export: 0,
  image_generation: 2,
  video_generation: 5,
};

export function isFreeFeature(featureKey: FeaturePriceKey) {
  return FREE_FEATURE_KEYS.has(featureKey);
}

export function getDefaultFeatureCreditCost(featureKey: FeaturePriceKey) {
  return DEFAULT_FEATURE_CREDIT_COST[featureKey];
}

export function normalizeFeatureCreditCost(featureKey: FeaturePriceKey, creditCost: number) {
  if (isFreeFeature(featureKey)) {
    return 0;
  }

  return Math.max(0, Math.trunc(creditCost));
}

export function normalizeFeaturePriceRecord(record: FeaturePriceRecord): FeaturePriceRecord {
  return {
    ...record,
    credit_cost: normalizeFeatureCreditCost(record.feature_key, record.credit_cost),
  };
}
