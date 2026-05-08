export function SurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[var(--radius-card)] border bg-[color:color-mix(in_srgb,var(--surface)_88%,var(--surface-tint)_12%)] p-5 sm:p-6",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
