import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
        Loading data from the workspace...
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-[28px] border border-[var(--border)] bg-[var(--surface)]"
          />
        ))}
      </div>
    </div>
  );
}
