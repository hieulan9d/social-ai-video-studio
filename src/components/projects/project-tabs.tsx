import Link from "next/link";
import type { ProjectTab } from "@/lib/projects/types";

const tabLabels: Record<ProjectTab, string> = {
  overview: "Overview",
  images: "Images",
  videos: "Videos",
  assets: "Assets",
  prompts: "Prompts",
};

export function ProjectTabs({
  projectId,
  activeTab,
}: {
  projectId: string;
  activeTab: ProjectTab;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2">
      {(Object.keys(tabLabels) as ProjectTab[]).map((tab) => (
        <Link
          key={tab}
          href={`/projects/${projectId}?tab=${tab}`}
          className={[
            "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
            tab === activeTab
              ? "border-transparent bg-[var(--foreground)] text-[var(--background)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {tabLabels[tab]}
        </Link>
      ))}
    </nav>
  );
}
