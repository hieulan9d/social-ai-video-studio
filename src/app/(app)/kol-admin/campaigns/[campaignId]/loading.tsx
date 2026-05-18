export default function CampaignDetailLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
      <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/5" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-white/10 bg-white/5" />
    </div>
  );
}
