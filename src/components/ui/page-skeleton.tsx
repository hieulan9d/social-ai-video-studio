export function PageSkeleton({
  blocks = 3,
}: {
  blocks?: number;
}) {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-32 rounded-full bg-[var(--surface-muted)]" />
        <div className="h-10 w-72 rounded-[12px] bg-[var(--surface-muted)]" />
        <div className="h-4 w-full max-w-3xl rounded-full bg-[var(--surface-muted)]" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: blocks }).map((_, index) => (
          <div
            key={index}
            className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-5"
          >
            <div className="h-4 w-28 rounded-full bg-[var(--surface-muted)]" />
            <div className="mt-4 h-8 w-24 rounded-[10px] bg-[var(--surface-muted)]" />
            <div className="mt-5 h-24 rounded-[12px] bg-[var(--surface-muted)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
