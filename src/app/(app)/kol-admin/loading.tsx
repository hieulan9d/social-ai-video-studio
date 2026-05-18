export default function KolAdminLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-72 animate-pulse rounded bg-white/5" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border border-white/10 bg-white/5" />
        ))}
      </div>
    </div>
  );
}
