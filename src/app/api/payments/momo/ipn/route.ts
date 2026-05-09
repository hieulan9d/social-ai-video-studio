import { NextRequest, NextResponse } from "next/server";
import { verifyMomoSignature, type MomoIpnPayload } from "@/lib/payments/momo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WalletMutationResultRecord } from "@/lib/wallet/types";

type PaymentOrderRow = {
  id: string;
  user_id: string;
  order_id: string;
  request_id: string;
  amount_vnd: number;
  total_credits: number;
  status: "pending" | "paid" | "failed" | "expired" | "cancelled" | "credited";
  credit_transaction_id: string | null;
};

function momoSuccessResponse() {
  return NextResponse.json({ resultCode: 0, message: "Success" });
}

function momoErrorResponse(message: string, status = 400) {
  return NextResponse.json({ resultCode: 1, message }, { status });
}

export async function POST(request: NextRequest) {
  let payload: MomoIpnPayload;

  try {
    payload = (await request.json()) as MomoIpnPayload;
  } catch {
    return momoErrorResponse("Invalid JSON", 400);
  }

  if (!verifyMomoSignature(payload)) {
    return momoErrorResponse("Invalid signature", 400);
  }

  const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
  const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
  const amount = Number(payload.amount);
  const resultCode = Number(payload.resultCode);
  const transId = payload.transId ? String(payload.transId) : null;
  const message = typeof payload.message === "string" ? payload.message : null;

  if (!orderId || !requestId) {
    return momoErrorResponse("Missing orderId/requestId", 400);
  }

  const admin = createAdminClient();
  const { data: order, error: fetchError } = await admin
    .from("payment_orders")
    .select("id, user_id, order_id, request_id, amount_vnd, total_credits, status, credit_transaction_id")
    .eq("order_id", orderId)
    .eq("request_id", requestId)
    .maybeSingle<PaymentOrderRow>();

  if (fetchError) {
    console.error("MoMo IPN fetch order failed:", fetchError);
    return momoErrorResponse("Order lookup failed", 500);
  }

  if (!order) {
    return momoErrorResponse("Order not found", 404);
  }

  if (order.status === "credited" || order.credit_transaction_id) {
    return momoSuccessResponse();
  }

  if (amount !== order.amount_vnd) {
    await admin
      .from("payment_orders")
      .update({
        status: "failed",
        result_code: resultCode,
        message: "Sai số tiền thanh toán.",
        momo_trans_id: transId,
        raw_ipn_payload: payload,
      })
      .eq("id", order.id);

    return momoErrorResponse("Amount mismatch", 400);
  }

  if (resultCode !== 0) {
    await admin
      .from("payment_orders")
      .update({
        status: "failed",
        result_code: resultCode,
        message,
        momo_trans_id: transId,
        raw_ipn_payload: payload,
      })
      .eq("id", order.id);

    return momoSuccessResponse();
  }

  const { error: paidUpdateError } = await admin
    .from("payment_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      result_code: resultCode,
      message,
      momo_trans_id: transId,
      raw_ipn_payload: payload,
    })
    .eq("id", order.id)
    .in("status", ["pending", "paid"]);

  if (paidUpdateError) {
    console.error("MoMo IPN paid update failed:", paidUpdateError);
    return momoErrorResponse("Cannot update order", 500);
  }

  const { data: creditResult, error: creditError } = await admin
    .rpc("add_credits", {
      p_user_id: order.user_id,
      p_amount: order.total_credits,
      p_reason: "Nạp credit qua MoMo",
      p_reference_type: "payment",
      p_reference_id: order.id,
      p_metadata: {
        provider: "momo",
        orderId,
        requestId,
        transId,
        amountVnd: amount,
      },
    })
    .single<WalletMutationResultRecord>();

  if (creditError) {
    if (creditError.code === "23505") {
      return momoSuccessResponse();
    }

    console.error("MoMo IPN add credit failed:", creditError);
    return momoErrorResponse("Cannot credit wallet", 500);
  }

  await admin.rpc("sync_user_credits_from_wallet", {
    p_user_id: order.user_id,
  });

  const { error: creditedUpdateError } = await admin
    .from("payment_orders")
    .update({
      status: "credited",
      paid_at: new Date().toISOString(),
      credited_at: new Date().toISOString(),
      credit_transaction_id: creditResult.transaction_id,
      momo_trans_id: transId,
      raw_ipn_payload: payload,
      result_code: resultCode,
      message,
    })
    .eq("id", order.id)
    .is("credit_transaction_id", null);

  if (creditedUpdateError) {
    console.error("MoMo IPN credited update failed:", creditedUpdateError);
    return momoErrorResponse("Cannot mark credited", 500);
  }

  return momoSuccessResponse();
}
