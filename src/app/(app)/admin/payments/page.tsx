import { requireAdmin } from "@/lib/auth/get-current-user";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";

type PaymentOrderAdminRow = {
  id: string;
  order_code: number;
  provider: string;
  amount_vnd: number;
  total_credits: number;
  status: string;
  payment_link_id: string | null;
  transaction_id: string | null;
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
  let orders: PaymentOrderAdminRow[] = [];

  try {
    await requireAdmin();
    const { status } = await searchParams;
    orders = await getPaymentOrders(status);
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Admin payments page load failed:", error);
    return <ServerDataFallback />;
  }

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

      <div className="overflow-x-auto rounded-[var(--radius-card)] border bg-[var(--surface)] p-5">
        <table className="min-w-[1180px] text-left text-sm">
          <thead className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="px-3 py-3">Order code</th>
              <th className="px-3 py-3">Provider</th>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Gói</th>
              <th className="px-3 py-3">Số tiền</th>
              <th className="px-3 py-3">Credit</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Payment link</th>
              <th className="px-3 py-3">Transaction</th>
              <th className="px-3 py-3">Ngày tạo</th>
              <th className="px-3 py-3">Paid</th>
              <th className="px-3 py-3">Credited</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--border)]">
                <td className="px-3 py-3 text-[var(--heading)]">{order.order_code}</td>
                <td className="px-3 py-3 uppercase">{order.provider}</td>
                <td className="px-3 py-3">{order.user_id}</td>
                <td className="px-3 py-3">{order.credit_packages?.name ?? "-"}</td>
                <td className="px-3 py-3">
                  {order.amount_vnd.toLocaleString("vi-VN")}đ
                </td>
                <td className="px-3 py-3">{order.total_credits}</td>
                <td className="px-3 py-3">{order.status}</td>
                <td className="px-3 py-3">{order.payment_link_id ?? "-"}</td>
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
  const admin = createAdminClient();
  let query = admin
    .from("payment_orders")
    .select(
      "id, order_code, provider, user_id, amount_vnd, total_credits, status, payment_link_id, transaction_id, created_at, paid_at, credited_at, credit_packages(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status && ["pending", "paid", "credited", "failed", "cancelled"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<PaymentOrderAdminRow[]>();

  if (error) {
    console.error("Admin payment_orders query failed:", error);
    throw error;
  }

  return data ?? [];
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "-";
}
