export function PageSkeleton({
  blocks = 3,
}: {
  blocks?: number;
}) {
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-white/[0.05]" />
        <div className="h-9 w-64 rounded-xl bg-white/[0.05]" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-white/[0.03]" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: blocks }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <div className="h-4 w-24 rounded-full bg-white/[0.05]" />
            <div className="mt-4 h-7 w-20 rounded-lg bg-white/[0.05]" />
            <div className="mt-5 h-20 rounded-xl bg-white/[0.03]" />
          </div>
        ))}
      </div>
    </div>
  );
}
