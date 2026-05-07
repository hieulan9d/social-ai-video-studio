import { startCheckout } from "@/lib/payments/actions";
import type { CreditPackage } from "@/lib/wallet/types";

export function CreditPackageCard({
  item,
  primaryProvider = "mock",
}: {
  item: CreditPackage;
  primaryProvider?: "mock";
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{item.name}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {item.description}
          </p>
        </div>
        <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
          {item.currency}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Credits
          </p>
          <p className="mt-2 text-3xl font-semibold">{item.credits}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
            Price
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {item.currency} {item.priceAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <form action={startCheckout}>
          <input type="hidden" name="packageId" value={item.id} />
          <input type="hidden" name="provider" value={primaryProvider} />
          <button
            type="submit"
            className="rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
          >
            Top up with Mock
          </button>
        </form>

        {["Stripe", "MoMo", "VNPay"].map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-60"
          >
            {provider} placeholder
          </button>
        ))}
      </div>
    </div>
  );
}
