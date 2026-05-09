import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { getSiteUrl } from "@/lib/env";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";
import { createPayosPaymentLink } from "@/lib/payments/payos";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type CreditPackageRow = {
  id: string;
  name: string;
  credits: number;
  price_vnd: number | null;
  price_amount: number;
  bonus_credits: number | null;
  is_active: boolean;
};

type PaymentOrderRow = {
  id: string;
  order_id: string;
  order_code: number;
  amount_vnd: number;
  amount: number | null;
  credits: number;
  bonus_credits: number;
  total_credits: number;
  status: string;
};

function createOrderCode() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function buildResultUrl(orderId: string, result: "return" | "cancel") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? getSiteUrl();
  const configuredUrl =
    result === "return" ? process.env.PAYOS_RETURN_URL : process.env.PAYOS_CANCEL_URL;
  const url = new URL(configuredUrl ?? "/credits/payment-result", appUrl);
  url.searchParams.set("provider", "payos");
  url.searchParams.set("orderId", orderId);
  url.searchParams.set("result", result);
  return url.toString();
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { packageId?: unknown };

    if (typeof body.packageId !== "string" || !body.packageId) {
      throw new AppError("Thiếu gói credit.", 400);
    }

    const admin = createAdminClient();
    const { data: creditPackage, error: packageError } = await admin
      .from("credit_packages")
      .select("id, name, credits, price_vnd, price_amount, bonus_credits, is_active")
      .eq("id", body.packageId)
      .eq("is_active", true)
      .maybeSingle<CreditPackageRow>();

    if (packageError) throw packageError;
    if (!creditPackage) throw new AppError("Không tìm thấy gói credit.", 404);

    const amountVnd = Math.trunc(
      creditPackage.price_vnd ?? Number(creditPackage.price_amount),
    );
    const bonusCredits = Math.max(0, Math.trunc(creditPackage.bonus_credits ?? 0));
    const totalCredits = creditPackage.credits + bonusCredits;
    const orderCode = createOrderCode();
    const orderId = `PAYOS_${orderCode}`;
    const requestId = `PAYOS_REQ_${randomUUID().slice(0, 8)}_${orderCode}`;

    const { data: order, error: insertError } = await admin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        package_id: creditPackage.id,
        provider: "payos",
        order_id: orderId,
        order_code: orderCode,
        request_id: requestId,
        amount_vnd: amountVnd,
        amount: amountVnd,
        credits: creditPackage.credits,
        bonus_credits: bonusCredits,
        total_credits: totalCredits,
        status: "pending",
      })
      .select("id, order_id, order_code, amount_vnd, amount, credits, bonus_credits, total_credits, status")
      .single<PaymentOrderRow>();

    if (insertError) throw insertError;

    const paymentLink = await createPayosPaymentLink({
      orderCode,
      amount: amountVnd,
      description: `Nap ${totalCredits} credit`,
      returnUrl: buildResultUrl(orderId, "return"),
      cancelUrl: buildResultUrl(orderId, "cancel"),
      items: [
        {
          name: creditPackage.name,
          quantity: 1,
          price: amountVnd,
        },
      ],
    });

    const { data: updatedOrder, error: updateError } = await admin
      .from("payment_orders")
      .update({
        checkout_url: paymentLink.checkoutUrl,
        qr_code: paymentLink.qrCode,
        pay_url: paymentLink.checkoutUrl,
        qr_code_url: paymentLink.qrCode,
        raw_create_response: paymentLink,
        message: paymentLink.status,
        status: paymentLink.status === "PENDING" ? "pending" : "failed",
      })
      .eq("id", order.id)
      .select("id, order_id, order_code, amount_vnd, amount, credits, bonus_credits, total_credits, status")
      .single<PaymentOrderRow>();

    if (updateError) throw updateError;

    if (paymentLink.status !== "PENDING") {
      throw new AppError("PayOS chưa tạo được giao dịch thanh toán.", 400);
    }

    return apiSuccessResponse({
      order: {
        id: updatedOrder.id,
        orderId: updatedOrder.order_id,
        orderCode: updatedOrder.order_code,
        amountVnd: updatedOrder.amount_vnd,
        credits: updatedOrder.credits,
        bonusCredits: updatedOrder.bonus_credits,
        totalCredits: updatedOrder.total_credits,
        status: updatedOrder.status,
      },
      payment: {
        checkoutUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
