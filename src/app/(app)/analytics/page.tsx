import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const AnalyticsPageClient = dynamic(
  () =>
    import("@/components/analytics/analytics-page-client").then(
      (mod) => mod.AnalyticsPageClient,
    ),
  {
    loading: () => <PageSkeleton blocks={4} />,
  },
);

export default function AnalyticsPage() {
  return <AnalyticsPageClient />;
}
