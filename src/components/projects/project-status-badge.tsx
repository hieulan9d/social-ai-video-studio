import type { ProjectStatus } from "@/lib/projects/types";

const statusClasses: Record<ProjectStatus, string> = {
  draft: "bg-slate-500/15 text-slate-300",
  brief_ready: "bg-sky-500/15 text-sky-300",
  script_ready: "bg-indigo-500/15 text-indigo-300",
  rendering: "bg-amber-500/15 text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-400",
  archived: "bg-zinc-500/15 text-zinc-400",
};

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Bản nháp",
  brief_ready: "Brief đã sẵn sàng",
  script_ready: "Kịch bản đã sẵn sàng",
  rendering: "Đang render",
  completed: "Đã hoàn tất",
  archived: "Đã lưu trữ",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-medium capitalize",
        statusClasses[status],
      ].join(" ")}
    >
      {statusLabels[status]}
    </span>
  );
}
