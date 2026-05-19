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
        "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
