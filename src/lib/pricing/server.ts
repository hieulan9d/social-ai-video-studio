import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  FeaturePriceKey,
  FeaturePriceRecord,
} from "@/lib/pricing/types";

const FEATURE_PRICE_SELECT =
  "id, feature_key, name, description, credit_cost, is_active, metadata, created_at, updated_at";

export async function getFeaturePricing() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feature_pricing")
    .select(FEATURE_PRICE_SELECT)
    .order("name", { ascending: true })
    .returns<FeaturePriceRecord[]>();

  if (error) {
    console.error("PRICING SUPABASE ERROR:", error);
    return []; // trả mảng rỗng thay vì crash app
  }

  return data ?? [];
}

export async function getFeatureCreditCost(
  featureKey: FeaturePriceKey
) {
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
    return 0; // tránh crash
  }

  if (!data) {
    console.error(
      `Feature pricing not found: ${featureKey}`
    );
    return 0;
  }

  if (!data.is_active) {
    console.error(
      `Feature pricing inactive: ${featureKey}`
    );
    return 0;
  }

  return data.credit_cost ?? 0;
}