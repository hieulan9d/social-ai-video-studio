import { CreditPackageCard } from "@/components/wallet/credit-package-card";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { getPaymentHistory } from "@/lib/payments/server";
import {
  getCreditPackages,
  getUserWallet,
  getWalletTransactions,
} from "@/lib/wallet/server";

export default async function WalletPage() {
  const user = await requireUserProfile();
  const [wallet, transactions, packages, payments] = await Promise.all([
    getUserWallet(user.id),
    getWalletTransactions(user.id, 8),
    getCreditPackages(),
    getPaymentHistory(user.id, 8),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Usage and billing"
        title="Wallet & Credits"
        description="Wallet balance is always loaded from the database, payment completion is webhook-driven, and every credit change is tracked in the ledger."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {[
          {
            label: "Available credits",
            value: wallet.balanceCredit.toString(),
            note: "Live balance from database",
          },
          {
            label: "Current plan",
            value: packages.length > 0 ? "Top-up ready" : "No packages yet",
            note: "Credit packages are managed from the database",
          },
          {
            label: "Payments tracked",
            value: payments.length.toString(),
            note: "Pending and completed top-up attempts",
          },
        ].map((item) => (
          <SurfaceCard key={item.label}>
            <p className="text-sm text-[var(--muted-foreground)]">{item.label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">{item.value}</p>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{item.note}</p>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <h2 className="text-xl font-semibold">Credit packages</h2>
          <div className="mt-6 space-y-4">
            {packages.length > 0 ? (
              packages.map((item) => <CreditPackageCard key={item.id} item={item} />)
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                No credit packages are available yet.
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Payment history</h2>
          <div className="mt-6 space-y-3">
            {payments.length > 0 ? (
              payments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[var(--border)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {item.provider.toUpperCase()} · {item.creditsPurchased} credits
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium",
                        item.status === "success"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : item.status === "failed"
                            ? "bg-rose-500/15 text-rose-400"
                            : "bg-amber-500/15 text-amber-300",
                      ].join(" ")}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                    <span className="text-[var(--muted-foreground)]">
                      {item.currency} {item.amount.toFixed(2)}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {item.creditedAt ? "Credits added" : "Awaiting webhook"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
                No payment attempts yet.
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <h2 className="text-xl font-semibold">Credit transaction history</h2>
        <div className="mt-6 space-y-3">
          {transactions.length > 0 ? (
            transactions.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-4"
              >
                <div>
                  <p className="font-medium">
                    {item.reason || formatTransactionType(item.transactionType)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {new Date(item.createdAt).toLocaleString()} · Balance after{" "}
                    {item.balanceAfter}
                  </p>
                </div>
                <span
                  className={[
                    "text-sm font-medium",
                    item.amountCredit > 0 ? "text-emerald-400" : "text-rose-400",
                  ].join(" ")}
                >
                  {item.amountCredit > 0 ? "+" : ""}
                  {item.amountCredit}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
              No credit transactions yet. New purchases, deductions, and refunds will
              appear here.
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

function formatTransactionType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
