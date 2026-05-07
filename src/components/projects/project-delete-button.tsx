import { deleteProjectAction } from "@/lib/projects/actions";

export function ProjectDeleteButton({ projectId }: { projectId: string }) {
  return (
    <form action={deleteProjectAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        className="rounded-2xl border border-rose-500/30 px-4 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10"
      >
        Delete project
      </button>
    </form>
  );
}
