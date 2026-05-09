import { requireAdmin } from "@/lib/auth/get-current-user";
import { createAdminClient } from "@/lib/supabase/admin";

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

type PaymentOrderAdminRow = {
  order_id: string;
  order_code: number | null;
  provider: string;
  amount_vnd: number;
  amount: number | null;
  total_credits: number;
  status: string;
  transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
  credited_at: string | null;
  user_id: string;
  credit_packages: {
    name: string;
  } | null;
};

type LegacyPaymentOrderAdminRow = {
  order_id: string;
  provider: string;
  amount_vnd: number;
  total_credits: number;
  status: string;
  momo_trans_id: string | null;
  created_at: string;
  paid_at: string | null;
  credited_at: string | null;
  user_id: string;
  credit_packages: {
    name: string;
  } | null;
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const { orders, needsMigration } = await getPaymentOrders(status);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-medium text-[var(--heading)]">
          Đơn thanh toán
        </h1>
      </div>

      {needsMigration ? (
        <div className="rounded-[12px] border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-4 py-3 text-sm text-[var(--pending)]">
          Database chưa có đủ cột PayOS. Hãy chạy migration mới để xem đầy đủ order
          code, QR và mã giao dịch.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[var(--radius-card)] border bg-[var(--surface)] p-5">
        <table className="min-w-[1180px] text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="px-3 py-3">Order ID</th>
              <th className="px-3 py-3">Order code</th>
              <th className="px-3 py-3">Provider</th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Gói</th>
              <th className="px-3 py-3">Số tiền</th>
              <th className="px-3 py-3">Credit</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Transaction</th>
              <th className="px-3 py-3">Ngày tạo</th>
              <th className="px-3 py-3">Paid</th>
              <th className="px-3 py-3">Credited</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_id} className="border-b border-[var(--border)]">
                <td className="px-3 py-3 text-[var(--heading)]">{order.order_id}</td>
                <td className="px-3 py-3">{order.order_code ?? "-"}</td>
                <td className="px-3 py-3 uppercase">{order.provider}</td>
                <td className="px-3 py-3">{order.user_id}</td>
                <td className="px-3 py-3">{order.credit_packages?.name ?? "-"}</td>
                <td className="px-3 py-3">
                  {(order.amount ?? order.amount_vnd).toLocaleString("vi-VN")}đ
                </td>
                <td className="px-3 py-3">{order.total_credits}</td>
                <td className="px-3 py-3">{order.status}</td>
                <td className="px-3 py-3">{order.transaction_id ?? "-"}</td>
                <td className="px-3 py-3">
                  {new Date(order.created_at).toLocaleString("vi-VN")}
                </td>
                <td className="px-3 py-3">{formatDate(order.paid_at)}</td>
                <td className="px-3 py-3">{formatDate(order.credited_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 ? (
          <div className="mt-4 rounded-[12px] border border-dashed px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            Chưa có đơn thanh toán nào.
          </div>
        ) : null}
      </div>
    </div>
  );
}

async function getPaymentOrders(status?: string) {
  const result = await getPaymentOrdersWithPayosColumns(status);

  if (result.error && isMissingPaymentSchemaError(result.error)) {
    return getPaymentOrdersWithLegacyColumns(status);
  }

  if (result.error) {
    throw result.error;
  }

  return {
    orders: result.orders,
    needsMigration: false,
  };
}

async function getPaymentOrdersWithPayosColumns(status?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("payment_orders")
    .select(
      "order_id, order_code, provider, user_id, amount_vnd, amount, total_credits, status, transaction_id, created_at, paid_at, credited_at, credit_packages(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && ["pending", "credited", "failed"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<PaymentOrderAdminRow[]>();

  return {
    orders: data ?? [],
    error: error as SupabaseLikeError | null,
  };
}

async function getPaymentOrdersWithLegacyColumns(status?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("payment_orders")
    .select(
      "order_id, provider, user_id, amount_vnd, total_credits, status, momo_trans_id, created_at, paid_at, credited_at, credit_packages(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && ["pending", "credited", "failed"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<LegacyPaymentOrderAdminRow[]>();

  if (error && isMissingPaymentSchemaError(error)) {
    return {
      orders: [],
      needsMigration: true,
    };
  }

  if (error) {
    throw error;
  }

  return {
    orders: (data ?? []).map((order) => ({
      ...order,
      order_code: null,
      amount: null,
      transaction_id: order.momo_trans_id,
    })),
    needsMigration: true,
  };
}

function isMissingPaymentSchemaError(error: SupabaseLikeError) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    message.includes("column") ||
    message.includes("payment_orders")
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "-";
}
