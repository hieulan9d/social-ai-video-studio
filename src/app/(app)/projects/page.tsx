import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const ProjectsPageClient = dynamic(
  () => import("@/components/projects/projects-page-client").then((mod) => mod.ProjectsPageClient),
  {
    loading: () => <PageSkeleton blocks={6} />,
  },
);

export default function ProjectsPage() {
  return <ProjectsPageClient />;
}
