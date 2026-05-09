import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const DashboardPageClient = dynamic(
  () =>
    import("@/components/dashboard/dashboard-page-client").then(
      (mod) => mod.DashboardPageClient,
    ),
  {
    loading: () => <PageSkeleton blocks={4} />,
  },
);

export default function DashboardPage() {
  return <DashboardPageClient />;
}
