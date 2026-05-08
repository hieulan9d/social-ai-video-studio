import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const QuickHistoryPageClient = dynamic(
  () =>
    import("@/components/quick-create/quick-history-page-client").then(
      (mod) => mod.QuickHistoryPageClient,
    ),
  {
    loading: () => <PageSkeleton blocks={4} />,
  },
);

export default function QuickHistoryPage() {
  return <QuickHistoryPageClient />;
}
