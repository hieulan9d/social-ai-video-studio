import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 text-sm text-[var(--muted-foreground)] shadow-[var(--shadow-soft)]">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
        Đang tải workspace...
      </div>
    </main>
  );
}
