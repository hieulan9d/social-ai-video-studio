import type { FeaturePriceKey, FeaturePriceRecord } from "@/lib/pricing/types";

export type FeatureCostMap = Record<FeaturePriceKey, number>;

export function buildFeatureCostMap(featurePrices: FeaturePriceRecord[]): FeatureCostMap {
  const defaults: FeatureCostMap = {
    text_generation: 0,
    scene_generation: 0,
    prompt_generation: 0,
    veo_render: 0,
    image_to_video: 0,
    transition_video: 0,
    export: 0,
    image_generation: 0,
    video_generation: 0,
  };

  for (const item of featurePrices) {
    defaults[item.feature_key] = item.credit_cost;
  }

  return defaults;
}

export function formatCreditEstimate(credits: number) {
  return `${credits} credit${credits === 1 ? "" : "s"}`;
}

export function formatCreditRangeEstimate(min: number, max: number) {
  if (min === max) {
    return formatCreditEstimate(min);
  }

  return `${min}-${max} credits`;
}
