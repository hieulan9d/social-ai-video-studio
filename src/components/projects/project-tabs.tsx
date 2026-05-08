import Link from "next/link";
import type { ProjectTab } from "@/lib/projects/types";

const tabLabels: Record<ProjectTab, string> = {
  overview: "Tổng quan",
  images: "Tạo ảnh",
  videos: "Tạo video",
  assets: "Assets",
  prompts: "Prompt AI",
};

export function ProjectTabs({
  projectId,
  activeTab,
}: {
  projectId: string;
  activeTab: ProjectTab;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {(Object.keys(tabLabels) as ProjectTab[]).map((tab) => (
        <Link
          key={tab}
          href={`/projects/${projectId}?tab=${tab}`}
          className={[
            "whitespace-nowrap rounded-[8px] border px-4 py-2.5 text-sm",
            tab === activeTab
              ? "border-[#29508d] bg-[#1a3a7a] text-[var(--heading)]"
              : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {tabLabels[tab]}
        </Link>
      ))}
    </nav>
  );
}
