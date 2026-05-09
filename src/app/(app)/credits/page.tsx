import { Coins, TrendingDown, TrendingUp } from "lucide-react";
import {
  PayosTopUpSection,
  type PayosCreditPackage,
} from "@/components/payments/PayosTopUpSection";
import { PageHeader } from "@/components/ui/page-header";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUser } from "@/lib/auth/get-current-user";
import {
  getUserCredits,
  getUserCreditTransactions,
} from "@/lib/credits/credit-service";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditTransactionType } from "@/types/user";

const TRANSACTION_LABELS: Record<CreditTransactionType, string> = {
  add: "Cộng credit",
  use: "Sử dụng",
  refund: "Hoàn credit",
  adjust: "Điều chỉnh",
  bonus: "Thưởng đăng ký",
};

type CreditPackageRow = {
  id: string;
  name: string;
  credits: number;
  price_amount: number;
  bonus_credits: number | null;
};

export default async function CreditsPage() {
  let pageData;

  try {
    const user = await requireUser();
    const [credits, transactions, packages] = await Promise.all([
      getUserCredits(user.id),
      getUserCreditTransactions(user.id, { page: 1, limit: 50 }),
      getPayosCreditPackages(),
    ]);

    pageData = { credits, transactions, packages };
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Credits page load failed:", error);
    return <ServerDataFallback />;
  }

  const { credits, transactions, packages } = pageData;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Credits"
        title="Tài khoản credit"
        description="Theo dõi số dư, tổng credit đã cộng, tổng credit đã dùng và lịch sử giao dịch."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          label="Số dư credit"
          value={credits.balance}
          icon={Coins}
          tone="text-[#fbbf24]"
        />
        <MetricCard
          label="Tổng đã nạp"
          value={credits.total_added}
          icon={TrendingUp}
          tone="text-[var(--success)]"
        />
        <MetricCard
          label="Tổng đã dùng"
          value={credits.total_used}
          icon={TrendingDown}
          tone="text-[var(--danger)]"
        />
      </div>

      <PayosTopUpSection packages={packages} />

      <SurfaceCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-[var(--heading)]">
              Lịch sử giao dịch credit
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Chỉ server mới có quyền cộng, trừ, hoàn hoặc điều chỉnh credit.
            </p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-3">Thời gian</th>
                  <th className="px-3 py-3">Loại</th>
                  <th className="px-3 py-3">Số credit</th>
                  <th className="px-3 py-3">Số dư sau</th>
                  <th className="px-3 py-3">Lý do</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-3 text-[var(--muted-foreground)]">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-3 text-[var(--heading)]">
                      {TRANSACTION_LABELS[item.type]}
                    </td>
                    <td
                      className={[
                        "px-3 py-3 font-medium",
                        item.amount >= 0
                          ? "text-[var(--success)]"
                          : "text-[var(--danger)]",
                      ].join(" ")}
                    >
                      {item.amount > 0 ? "+" : ""}
                      {item.amount}
                    </td>
                    <td className="px-3 py-3 text-[var(--foreground)]">
                      {item.balance_after}
                    </td>
                    <td className="px-3 py-3 text-[var(--muted-foreground)]">
                      {item.reason ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-[12px] border border-dashed px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có giao dịch credit nào.
            </div>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

async function getPayosCreditPackages(): Promise<PayosCreditPackage[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("credit_packages")
    .select("id, name, credits, price_amount, bonus_credits")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .returns<CreditPackageRow[]>();

  if (error) {
    console.error("PayOS credit packages query failed:", error);
    throw error;
  }

  return (data ?? []).map((item) => {
    const bonusCredits = Math.max(0, item.bonus_credits ?? 0);
    return {
      id: item.id,
      name: item.name,
      credits: item.credits,
      bonusCredits,
      totalCredits: item.credits + bonusCredits,
      priceVnd: Math.trunc(Number(item.price_amount)),
    };
  });
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <SurfaceCard>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
          {label}
        </p>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <p className="mt-4 text-4xl font-medium text-[var(--heading)]">
        {value.toLocaleString("vi-VN")}
      </p>
    </SurfaceCard>
  );
}
