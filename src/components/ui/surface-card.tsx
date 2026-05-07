export function SurfaceCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      {children}
    </section>
  );
}
