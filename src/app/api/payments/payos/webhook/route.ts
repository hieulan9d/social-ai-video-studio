import { NextRequest, NextResponse } from "next/server";
import { verifyPayosWebhook } from "@/lib/payments/payos";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WalletMutationResultRecord } from "@/lib/wallet/types";

export const runtime = "nodejs";

type PayosWebhookPayload = {
  code?: string;
  desc?: string;
  success?: boolean;
  data?: {
    code?: string;
    desc?: string;
  };
  signature?: string;
};

type PaymentOrderRow = {
  id: string;
  user_id: string;
  order_code: number;
  amount_vnd: number;
  total_credits: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "credited";
  credit_transaction_id: string | null;
};

function payosSuccessResponse() {
  return NextResponse.json({ success: true });
}

function payosErrorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: NextRequest) {
  let payload: PayosWebhookPayload;

  try {
    payload = (await request.json()) as PayosWebhookPayload;
  } catch {
    return payosErrorResponse("Invalid JSON", 400);
  }

  let webhookData;
  try {
    webhookData = await verifyPayosWebhook(payload);
  } catch (error) {
    console.error("PayOS webhook verification failed:", error);
    return payosErrorResponse("Invalid signature", 400);
  }

  const orderCode = Number(webhookData.orderCode);
  const amount = Number(webhookData.amount);
  const transactionId = webhookData.reference || webhookData.paymentLinkId;
  const isPaid =
    payload.success === true &&
    payload.code === "00" &&
    webhookData.code === "00" &&
    Number.isInteger(orderCode);

  if (!Number.isInteger(orderCode) || orderCode <= 0) {
    return payosErrorResponse("Missing orderCode", 400);
  }

  const admin = createAdminClient();
  const { data: order, error: fetchError } = await admin
    .from("payment_orders")
    .select("id, user_id, order_code, amount_vnd, total_credits, status, credit_transaction_id")
    .eq("provider", "payos")
    .eq("order_code", orderCode)
    .maybeSingle<PaymentOrderRow>();

  if (fetchError) {
    console.error("PayOS webhook fetch payment_orders failed:", fetchError);
    return payosErrorResponse("Order lookup failed", 500);
  }

  if (!order) {
    return payosErrorResponse("Order not found", 404);
  }

  if (order.status === "credited" || order.credit_transaction_id) {
    return payosSuccessResponse();
  }

  if (amount !== order.amount_vnd) {
    await admin
      .from("payment_orders")
      .update({
        status: "failed",
        transaction_id: transactionId,
        raw_payload: payload,
      })
      .eq("id", order.id);

    return payosErrorResponse("Amount mismatch", 400);
  }

  if (!isPaid) {
    await admin
      .from("payment_orders")
      .update({
        status: "failed",
        transaction_id: transactionId,
        raw_payload: payload,
      })
      .eq("id", order.id);

    return payosSuccessResponse();
  }

  const paidAt = new Date().toISOString();
  const { error: paidUpdateError } = await admin
    .from("payment_orders")
    .update({
      status: "paid",
      paid_at: paidAt,
      transaction_id: transactionId,
      raw_payload: payload,
    })
    .eq("id", order.id)
    .is("credit_transaction_id", null);

  if (paidUpdateError) {
    console.error("PayOS webhook paid update failed:", paidUpdateError);
    return payosErrorResponse("Cannot update order", 500);
  }

  const { data: creditResult, error: creditError } = await admin
    .rpc("add_credits", {
      p_user_id: order.user_id,
      p_amount: order.total_credits,
      p_reason: "Nạp credit qua PayOS",
      p_reference_type: "payment",
      p_reference_id: order.id,
      p_metadata: {
        provider: "payos",
        orderCode,
        transactionId,
        amountVnd: amount,
      },
    })
    .single<WalletMutationResultRecord>();

  if (creditError) {
    if (creditError.code === "23505") {
      return payosSuccessResponse();
    }

    console.error("PayOS webhook add credit failed:", creditError);
    return payosErrorResponse("Cannot credit wallet", 500);
  }

  await admin.rpc("sync_user_credits_from_wallet", {
    p_user_id: order.user_id,
  });

  const { error: creditedUpdateError } = await admin
    .from("payment_orders")
    .update({
      status: "credited",
      paid_at: paidAt,
      credited_at: new Date().toISOString(),
      credit_transaction_id: creditResult.transaction_id,
      transaction_id: transactionId,
      raw_payload: payload,
    })
    .eq("id", order.id)
    .is("credit_transaction_id", null);

  if (creditedUpdateError) {
    console.error("PayOS webhook credited update failed:", creditedUpdateError);
    return payosErrorResponse("Cannot mark credited", 500);
  }

  return payosSuccessResponse();
}
