export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--heading)] sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
