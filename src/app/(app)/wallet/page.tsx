import { Coins, CreditCard, History, LineChart } from "lucide-react";
import { CreditPackageCard } from "@/components/wallet/credit-package-card";
import { PageHeader } from "@/components/ui/page-header";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { getUserCredits } from "@/lib/credits/credit-service";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { formatMoneyVnd } from "@/lib/payments/format";
import { getPaymentHistory } from "@/lib/payments/server";
import {
  getCreditPackages,
  getWalletTransactions,
} from "@/lib/wallet/server";

export default async function WalletPage() {
  let pageData;

  try {
    const user = await requireUserProfile();
    const [credits, transactions, packages, payments] = await Promise.all([
      getUserCredits(user.id),
      getWalletTransactions(user.id, 12),
      getCreditPackages(),
      getPaymentHistory(user.id, 8),
    ]);
    pageData = { credits, transactions, packages, payments };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Wallet page load failed:", error);
    return <ServerDataFallback />;
  }

  const { credits, transactions, packages, payments } = pageData;

  const imageUsage = sumFeatureUsage(transactions, ["image_generation"]);
  const videoUsage = sumFeatureUsage(transactions, ["video_generation", "veo_render", "image_to_video", "transition_video"]);
  const promptUsage = sumFeatureUsage(transactions, ["prompt_generation"]);
  const scriptUsage = sumFeatureUsage(transactions, ["text_generation", "scene_generation"]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Credits / billing"
        title="Ví credits"
        description="Quản lý số dư hiện tại, gói nạp, lịch sử giao dịch và mức sử dụng theo từng nhóm tính năng."
      />

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
        <SurfaceCard className="rounded-[var(--radius-shell)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                Credits còn lại
              </p>
              <p className="mt-3 text-4xl font-medium text-[var(--heading)]">
                {credits.balance.toLocaleString("en-US")}
              </p>
            </div>
            <div className="rounded-full border border-[#1e3a6a] bg-[#111c35] px-4 py-2 text-[12px] text-[var(--foreground)]">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-[#fbbf24]" />
                <span>{credits.balance.toLocaleString("en-US")} credits</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Giao dịch" value={transactions.length.toString()} icon={History} />
            <MetricCard label="Thanh toán" value={payments.length.toString()} icon={CreditCard} />
            <MetricCard label="Gói khả dụng" value={packages.length.toString()} icon={LineChart} />
          </div>

          <div className="mt-6 rounded-[12px] border bg-[var(--surface-muted)] p-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Chỉ các luồng tạo ảnh và tạo video mới trừ credits. Prompt, script và các công cụ hỗ trợ khác hiện không tốn credits.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[var(--radius-shell)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Sử dụng theo tính năng</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Theo dõi nhóm tác vụ nào đang tiêu tốn credits nhiều nhất.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <UsageRow label="Image" value={imageUsage} color="bg-[#2dd4bf]" />
            <UsageRow label="Video" value={videoUsage} color="bg-[#60a5fa]" />
            <UsageRow label="Prompt" value={promptUsage} color="bg-[#a78bfa]" />
            <UsageRow label="Script" value={scriptUsage} color="bg-[#fbbf24]" />
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <h2 className="text-lg font-medium text-[var(--heading)]">Gói credits</h2>
          <div className="mt-5 space-y-4">
            {packages.length > 0 ? (
              packages.map((item) => <CreditPackageCard key={item.id} item={item} />)
            ) : (
              <EmptyBlock message="Chưa có gói credits khả dụng." />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-lg font-medium text-[var(--heading)]">Thanh toán gần đây</h2>
          <div className="mt-5 space-y-3">
            {payments.length > 0 ? (
              payments.map((item) => (
                <div key={item.id} className="rounded-[12px] border bg-[var(--surface-muted)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--heading)]">
                        {item.provider.toUpperCase()} · {item.creditsPurchased} credits
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <span className={getPaymentStatusClass(item.status)}>{item.status}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                    <span>
                      {formatMoneyVnd(item.amount, item.currency)}
                    </span>
                    <span>{item.creditedAt ? "Đã cộng credits" : "Đang chờ webhook"}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyBlock message="Chưa có thanh toán nào." />
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <h2 className="text-lg font-medium text-[var(--heading)]">Lịch sử giao dịch</h2>
        <div className="mt-5 space-y-3">
          {transactions.length > 0 ? (
            transactions.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--heading)]">
                    {item.reason || formatTransactionType(item.transactionType)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {new Date(item.createdAt).toLocaleString("vi-VN")} · Số dư sau giao dịch {item.balanceAfter}
                  </p>
                </div>
                <span
                  className={[
                    "text-sm font-medium",
                    item.amountCredit > 0 ? "text-[var(--success)]" : "text-[var(--danger)]",
                  ].join(" ")}
                >
                  {item.amountCredit > 0 ? "+" : ""}
                  {item.amountCredit}
                </span>
              </div>
            ))
          ) : (
            <EmptyBlock message="Chưa có giao dịch credits nào." />
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--highlight)]" />
      </div>
      <p className="mt-3 text-2xl font-medium text-[var(--heading)]">{value}</p>
    </div>
  );
}

function UsageRow({ label, value, color }: { label: string; value: number; color: string }) {
  const width = Math.min(100, Math.max(8, value * 8 || 8));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--foreground)]">{label}</span>
        <span className="text-[var(--muted-foreground)]">{value} credits</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-muted)]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-[12px] border border-dashed px-4 py-8 text-sm text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}

function formatTransactionType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sumFeatureUsage(
  transactions: Awaited<ReturnType<typeof getWalletTransactions>>,
  featureKeys: string[],
) {
  return transactions
    .filter((item) => item.amountCredit < 0)
    .filter((item) => {
      const referenceType = item.referenceType ?? "";
      const reason = item.reason ?? "";
      return featureKeys.some(
        (key) => referenceType.includes(key) || reason.includes(key),
      );
    })
    .reduce((total, item) => total + Math.abs(item.amountCredit), 0);
}

function getPaymentStatusClass(status: string) {
  const base =
    "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]";

  if (status === "success") {
    return `${base} border-[rgba(34,197,94,0.35)] text-[var(--success)]`;
  }

  if (status === "failed") {
    return `${base} border-[rgba(248,113,113,0.35)] text-[var(--danger)]`;
  }

  return `${base} border-[rgba(245,158,11,0.35)] text-[var(--pending)]`;
}
