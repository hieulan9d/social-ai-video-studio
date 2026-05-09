import QuickAIDashboard from "@/components/quick-ai/QuickAIDashboard";
import { AppShell } from "@/components/layout/app-shell";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { requireUserProfile } from "@/lib/auth/server";
import { getUserCredits } from "@/lib/credits/credit-service";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { getFeaturePricing } from "@/lib/pricing/server";
import { buildFeatureCostMap } from "@/lib/pricing/ui";

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
  let pageData;

  try {
    const user = await requireUserProfile();
    const { mode } = await searchParams;
    const [credits, featurePricing] = await Promise.all([
      getUserCredits(user.id),
      getFeaturePricing(),
    ]);
    pageData = {
      user,
      credits: credits.balance,
      mode,
      featureCosts: buildFeatureCostMap(featurePricing),
    };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Quick AI page load failed:", error);
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 text-[var(--foreground)]">
        <ServerDataFallback />
      </div>
    );
  }

  const { user, credits, mode, featureCosts } = pageData;

  return (
    <AppShell user={user} credits={credits}>
      <QuickAIDashboard initialMode={resolveMode(mode)} featureCosts={featureCosts} />
    </AppShell>
  );
}
