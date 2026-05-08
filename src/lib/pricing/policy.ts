import type { FeaturePriceKey, FeaturePriceRecord } from "@/lib/pricing/types";

const FREE_FEATURE_KEYS = new Set<FeaturePriceKey>([
  "text_generation",
  "scene_generation",
  "prompt_generation",
  "export",
]);

export function isFreeFeature(featureKey: FeaturePriceKey) {
  return FREE_FEATURE_KEYS.has(featureKey);
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
