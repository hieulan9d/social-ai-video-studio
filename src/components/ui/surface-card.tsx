import type { ComponentPropsWithoutRef } from "react";

export function SurfaceCard({
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      className={[
        "rounded-[var(--radius-card)] border bg-[color:color-mix(in_srgb,var(--surface)_88%,var(--surface-tint)_12%)] p-5 sm:p-6",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
