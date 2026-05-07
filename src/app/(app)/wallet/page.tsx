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
        eyebrow="Sử dụng và thanh toán"
        title="Ví tín dụng"
        description="Số dư ví luôn được đọc từ cơ sở dữ liệu, thanh toán hoàn tất qua webhook, và mọi thay đổi tín dụng đều được ghi vào ledger."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {[
          {
            label: "Tín dụng khả dụng",
            value: wallet.balanceCredit.toString(),
            note: "Số dư trực tiếp từ cơ sở dữ liệu",
          },
          {
            label: "Gói hiện tại",
            value: packages.length > 0 ? "Sẵn sàng nạp" : "Chưa có gói",
            note: "Các gói tín dụng được quản lý trong cơ sở dữ liệu",
          },
          {
            label: "Thanh toán đã ghi nhận",
            value: payments.length.toString(),
            note: "Các lần nạp đang chờ và đã hoàn tất",
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
          <h2 className="text-xl font-semibold">Gói tín dụng</h2>
          <div className="mt-6 space-y-4">
            {packages.length > 0 ? (
              packages.map((item) => <CreditPackageCard key={item.id} item={item} />)
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                Chưa có gói tín dụng khả dụng.
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Lịch sử thanh toán</h2>
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
                      {item.provider.toUpperCase()} / {item.creditsPurchased} tín dụng
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
                      {item.creditedAt ? "Đã cộng tín dụng" : "Đang chờ webhook"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
                Chưa có lần thanh toán nào.
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <h2 className="text-xl font-semibold">Lịch sử giao dịch tín dụng</h2>
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
                    {new Date(item.createdAt).toLocaleString()} / Số dư sau giao dịch{" "}
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
              Chưa có giao dịch tín dụng. Các lần mua, trừ tín dụng và hoàn tín
              dụng sẽ hiển thị tại đây.
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
