import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { FeaturePriceRecord } from "@/lib/pricing/types";
import type { CreditPackageRecord, CreditPackage } from "@/lib/wallet/types";

const FEATURE_PRICE_SELECT =
  "id, feature_key, name, description, credit_cost, is_active, metadata, created_at, updated_at";

export type PublicPricingData = {
  featurePrices: FeaturePriceRecord[];
  packages: CreditPackage[];
};

export async function getPublicPricingData(): Promise<PublicPricingData> {
  const supabase = await createClient();
  const [featurePricesResult, packagesResult] = await Promise.all([
    supabase
      .from("feature_pricing")
      .select(FEATURE_PRICE_SELECT)
      .eq("is_active", true)
      .order("credit_cost", { ascending: true })
      .returns<FeaturePriceRecord[]>(),
    supabase
      .from("credit_packages")
      .select("id, slug, name, description, credits, price_amount, currency, is_active")
      .eq("is_active", true)
      .order("credits", { ascending: true })
      .returns<CreditPackageRecord[]>(),
  ]);

  if (featurePricesResult.error) {
    throw featurePricesResult.error;
  }

  if (packagesResult.error) {
    throw packagesResult.error;
  }

  return {
    featurePrices: featurePricesResult.data,
    packages: packagesResult.data.map((record) => ({
      id: record.id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      credits: record.credits,
      priceAmount: record.price_amount,
      currency: record.currency,
      isActive: record.is_active,
    })),
  };
}
