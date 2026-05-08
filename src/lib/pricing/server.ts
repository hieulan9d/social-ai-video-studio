import "server-only";

import { cache } from "react";
import {
  getDefaultFeatureCreditCost,
  normalizeFeatureCreditCost,
  normalizeFeaturePriceRecord,
} from "@/lib/pricing/policy";
import { createClient } from "@/lib/supabase/server";
import type { FeaturePriceKey, FeaturePriceRecord } from "@/lib/pricing/types";

const FEATURE_PRICE_SELECT =
  "id, feature_key, name, description, credit_cost, is_active, metadata, created_at, updated_at";

export const getFeaturePricing = cache(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feature_pricing")
    .select(FEATURE_PRICE_SELECT)
    .order("name", { ascending: true })
    .returns<FeaturePriceRecord[]>();

  if (error) {
    console.error("PRICING SUPABASE ERROR:", error);
    return [];
  }

  return (data ?? []).map(normalizeFeaturePriceRecord);
});

export const getFeatureCreditCost = cache(async (featureKey: FeaturePriceKey) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feature_pricing")
    .select("credit_cost, is_active")
    .eq("feature_key", featureKey)
    .maybeSingle<{
      credit_cost: number;
      is_active: boolean;
    }>();

  if (error) {
    console.error("PRICING CREDIT ERROR:", error);
    return getDefaultFeatureCreditCost(featureKey);
  }

  if (!data) {
    return getDefaultFeatureCreditCost(featureKey);
  }

  if (!data.is_active) {
    return getDefaultFeatureCreditCost(featureKey);
  }

  return normalizeFeatureCreditCost(featureKey, data.credit_cost ?? 0);
});
