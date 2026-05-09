import { requireUser } from "@/lib/auth/get-current-user";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

type PaymentOrderStatusRow = {
  order_code: number;
  status: string;
  amount_vnd: number;
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
    const orderCode = Number(orderId);

    if (!Number.isInteger(orderCode) || orderCode <= 0) {
      throw new AppError("Mã đơn thanh toán không hợp lệ.", 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("payment_orders")
      .select("order_code, status, amount_vnd, total_credits, paid_at, credited_at")
      .eq("provider", "payos")
      .eq("order_code", orderCode)
      .eq("user_id", user.id)
      .maybeSingle<PaymentOrderStatusRow>();

    if (error) throw error;
    if (!data) throw new AppError("Không tìm thấy đơn thanh toán.", 404);

    return apiSuccessResponse({
      order: {
        orderId: String(data.order_code),
        orderCode: data.order_code,
        status: data.status,
        amountVnd: data.amount_vnd,
        totalCredits: data.total_credits,
        paidAt: data.paid_at,
        creditedAt: data.credited_at,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
