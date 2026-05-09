import { requireUser } from "@/lib/auth/get-current-user";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentOrderStatusRow = {
  order_id: string;
  order_code: number | null;
  status: string;
  amount_vnd: number;
  amount: number | null;
  total_credits: number;
  paid_at: string | null;
  credited_at: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const user = await requireUser();
    const { orderId } = await params;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("payment_orders")
      .select("order_id, order_code, status, amount_vnd, amount, total_credits, paid_at, credited_at")
      .eq("provider", "payos")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle<PaymentOrderStatusRow>();

    if (error) throw error;
    if (!data) throw new AppError("Không tìm thấy đơn thanh toán.", 404);

    return apiSuccessResponse({
      order: {
        orderId: data.order_id,
        orderCode: data.order_code,
        status: data.status,
        amountVnd: data.amount ?? data.amount_vnd,
        totalCredits: data.total_credits,
        paidAt: data.paid_at,
        creditedAt: data.credited_at,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
