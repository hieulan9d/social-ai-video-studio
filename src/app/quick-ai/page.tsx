import QuickAIDashboard from "@/components/quick-ai/QuickAIDashboard";
import { AppShell } from "@/components/layout/app-shell";
import { requireUserProfile } from "@/lib/auth/server";
import { getFeaturePricing } from "@/lib/pricing/server";
import { buildFeatureCostMap } from "@/lib/pricing/ui";
import { getUserWallet } from "@/lib/wallet/server";

function resolveMode(value?: string) {
  if (
    value === "text-to-image" ||
    value === "image-to-image" ||
    value === "text-to-video" ||
    value === "image-to-video" ||
    value === "start-end-image-to-video" ||
    value === "prompt" ||
    value === "script"
  ) {
    return value;
  }

  return "prompt";
}

export default async function QuickAIPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await requireUserProfile();
  const { mode } = await searchParams;
  const [wallet, featurePricing] = await Promise.all([getUserWallet(user.id), getFeaturePricing()]);
  const featureCosts = buildFeatureCostMap(featurePricing);

  return (
    <AppShell user={user} credits={wallet.balanceCredit}>
      <QuickAIDashboard initialMode={resolveMode(mode)} featureCosts={featureCosts} />
    </AppShell>
  );
}
