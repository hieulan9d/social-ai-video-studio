import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { startCheckout } from "@/lib/payments/actions";
import { formatMoneyVnd, getDisplayCurrencyLabel } from "@/lib/payments/format";
import type { CreditPackage } from "@/lib/wallet/types";

export function CreditPackageCard({
  item,
  primaryProvider = "mock",
}: {
  item: CreditPackage;
  primaryProvider?: "mock";
}) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-muted)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-medium text-[var(--heading)]">{item.name}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.description}</p>
        </div>
        <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
          {getDisplayCurrencyLabel(item.currency)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Tín dụng</p>
          <p className="mt-2 text-3xl font-medium text-[var(--heading)]">{item.credits}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Giá</p>
          <p className="mt-2 text-3xl font-medium text-[var(--heading)]">
            {formatMoneyVnd(item.priceAmount, item.currency)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <form action={startCheckout}>
          <input type="hidden" name="packageId" value={item.id} />
          <input type="hidden" name="provider" value={primaryProvider} />
          <FormSubmitButton
            pendingLabel="Đang mở thanh toán..."
            className="rounded-[8px] bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)]"
          >
            Nạp bằng Mock
          </FormSubmitButton>
        </form>

        {["Stripe", "MoMo", "VNPay"].map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            className="rounded-[8px] border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)] opacity-60"
          >
            {provider} placeholder
          </button>
        ))}
      </div>
    </div>
  );
}
