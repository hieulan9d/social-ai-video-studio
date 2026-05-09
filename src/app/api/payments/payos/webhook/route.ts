import { NextRequest, NextResponse } from "next/server";
import { verifyPayosWebhook } from "@/lib/payments/payos";
import { createAdminClient } from "@/lib/supabase/admin";

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

type CreditRpcResult = {
  success?: boolean;
  balance?: number;
  transaction_id?: string;
  error?: string;
};

function payosSuccessResponse(message = "Success") {
  return NextResponse.json({ success: true, message });
}

function payosErrorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function hasPayosEnv() {
  return Boolean(
    process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY,
  );
}

function isPayosWebhookPayload(payload: unknown): payload is PayosWebhookPayload {
  if (!payload || typeof payload !== "object") return false;

  const record = payload as Record<string, unknown>;
  return typeof record.signature === "string" && Boolean(record.data);
}

async function readPayload(request: NextRequest) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return {
      ok: false as const,
      error: "Invalid or empty PayOS webhook payload",
    };
  }

  try {
    return {
      ok: true as const,
      payload: JSON.parse(rawBody) as unknown,
    };
  } catch {
    return {
      ok: false as const,
      error: "Invalid or empty PayOS webhook payload",
    };
  }
}

function normalizeCreditResult(data: unknown): CreditRpcResult {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Invalid credit RPC response" };
  }

  return data as CreditRpcResult;
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "PayOS webhook endpoint is active",
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!hasPayosEnv()) {
      return payosErrorResponse("Missing PayOS environment variables", 200);
    }

    const parsedPayload = await readPayload(request);
    if (!parsedPayload.ok) {
      return payosErrorResponse(parsedPayload.error, 200);
    }

    if (!isPayosWebhookPayload(parsedPayload.payload)) {
      return payosErrorResponse("Invalid or empty PayOS webhook payload", 200);
    }

    const payload = parsedPayload.payload;
    let webhookData;

    try {
      webhookData = await verifyPayosWebhook(payload);
    } catch (error) {
      console.error("PayOS webhook verification failed:", error);
      return payosErrorResponse("Invalid PayOS webhook signature", 400);
    }

    const orderCode = Number(webhookData.orderCode);
    const amount = Number(webhookData.amount);
    const transactionId = String(
      webhookData.reference || webhookData.paymentLinkId || "",
    );
    const isPaid =
      payload.success === true &&
      payload.code === "00" &&
      String(webhookData.code) === "00" &&
      Number.isInteger(orderCode);

    if (!Number.isInteger(orderCode) || orderCode <= 0) {
      return payosErrorResponse("Missing orderCode", 200);
    }

    const admin = createAdminClient();
    const { data: order, error: fetchError } = await admin
      .from("payment_orders")
      .select(
        "id, user_id, order_code, amount_vnd, total_credits, status, credit_transaction_id",
      )
      .eq("provider", "payos")
      .eq("order_code", orderCode)
      .maybeSingle<PaymentOrderRow>();

    if (fetchError) {
      console.error("PayOS webhook fetch payment_orders failed:", fetchError);
      return payosErrorResponse("Order lookup failed", 200);
    }

    if (!order) {
      return payosErrorResponse("Order not found", 200);
    }

    if (order.status === "credited" || order.credit_transaction_id) {
      return payosSuccessResponse("Order already credited");
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

      return payosSuccessResponse("Payment was not successful");
    }

    if (order.status === "paid") {
      return payosSuccessResponse("Order is already being processed");
    }

    const paidAt = new Date().toISOString();
    const { data: claimedOrders, error: paidUpdateError } = await admin
      .from("payment_orders")
      .update({
        status: "paid",
        paid_at: paidAt,
        transaction_id: transactionId,
        raw_payload: payload,
      })
      .eq("id", order.id)
      .is("credit_transaction_id", null)
      .neq("status", "paid")
      .select("id");

    if (paidUpdateError) {
      console.error("PayOS webhook paid update failed:", paidUpdateError);
      return payosErrorResponse("Cannot update order", 200);
    }

    if (!claimedOrders?.length) {
      return payosSuccessResponse("Order is already being processed");
    }

    const { data: creditData, error: creditError } = await admin.rpc(
      "add_user_credits",
      {
        p_user_id: order.user_id,
        p_amount: order.total_credits,
        p_reason: "Nap credit qua PayOS",
        p_metadata: {
          provider: "payos",
          orderCode,
          transactionId,
          amountVnd: amount,
        },
      },
    );

    const creditResult = normalizeCreditResult(creditData);

    if (creditError || creditResult.success !== true) {
      console.error("PayOS webhook add_user_credits failed:", creditError || creditResult);
      return payosErrorResponse("Cannot credit wallet", 200);
    }

    const { error: creditedUpdateError } = await admin
      .from("payment_orders")
      .update({
        status: "credited",
        paid_at: paidAt,
        credited_at: new Date().toISOString(),
        credit_transaction_id: creditResult.transaction_id ?? null,
        transaction_id: transactionId,
        raw_payload: payload,
      })
      .eq("id", order.id)
      .is("credit_transaction_id", null);

    if (creditedUpdateError) {
      console.error("PayOS webhook credited update failed:", creditedUpdateError);
      return payosErrorResponse("Cannot mark credited", 200);
    }

    return payosSuccessResponse();
  } catch (error) {
    console.error("PayOS webhook error:", error);
    return payosErrorResponse("PayOS webhook processing failed", 200);
  }
}
