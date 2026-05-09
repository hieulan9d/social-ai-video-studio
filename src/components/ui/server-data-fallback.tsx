import { SurfaceCard } from "@/components/ui/surface-card";

export function ServerDataFallback({
  title = "Không tải được dữ liệu. Vui lòng thử lại.",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <SurfaceCard className="mx-auto max-w-3xl">
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-[var(--heading)]">{title}</p>
        {description ? (
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        ) : null}
      </div>
    </SurfaceCard>
  );
}
