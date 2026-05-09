import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/get-current-user";
import { getSiteUrl } from "@/lib/env";
import { apiErrorResponse, apiSuccessResponse, AppError } from "@/lib/errors";
import { createMomoPayment } from "@/lib/payments/momo";
import { createAdminClient } from "@/lib/supabase/admin";

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
  amount_vnd: number;
  credits: number;
  bonus_credits: number;
  total_credits: number;
  status: string;
};

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
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
    const orderId = createId("MVS");
    const requestId = createId("REQ");
    const extraData = Buffer.from(
      JSON.stringify({
        userId: user.id,
        packageId: creditPackage.id,
        orderId,
      }),
    ).toString("base64");

    const { data: order, error: insertError } = await admin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        package_id: creditPackage.id,
        provider: "momo",
        order_id: orderId,
        request_id: requestId,
        amount_vnd: amountVnd,
        credits: creditPackage.credits,
        bonus_credits: bonusCredits,
        total_credits: totalCredits,
        status: "pending",
      })
      .select("id, order_id, amount_vnd, credits, bonus_credits, total_credits, status")
      .single<PaymentOrderRow>();

    if (insertError) throw insertError;

    const redirectUrl = new URL(
      process.env.MOMO_REDIRECT_URL ?? "/credits/payment-result",
      process.env.NEXT_PUBLIC_APP_URL ?? getSiteUrl(),
    );
    redirectUrl.searchParams.set("orderId", orderId);

    const momoResponse = await createMomoPayment({
      orderId,
      requestId,
      amount: amountVnd,
      orderInfo: `Nap ${totalCredits} credit Social AI Video Studio`,
      redirectUrl: redirectUrl.toString(),
      extraData,
    });

    const resultCode = Number(momoResponse.resultCode ?? -1);
    const { data: updatedOrder, error: updateError } = await admin
      .from("payment_orders")
      .update({
        pay_url: momoResponse.payUrl ?? null,
        deeplink: momoResponse.deeplink ?? null,
        qr_code_url: momoResponse.qrCodeUrl ?? null,
        raw_create_response: momoResponse,
        result_code: resultCode,
        message: momoResponse.message ?? null,
        status: resultCode === 0 ? "pending" : "failed",
      })
      .eq("id", order.id)
      .select("id, order_id, amount_vnd, credits, bonus_credits, total_credits, status")
      .single<PaymentOrderRow>();

    if (updateError) throw updateError;

    if (resultCode !== 0) {
      throw new AppError(
        momoResponse.message || "MoMo chưa tạo được giao dịch thanh toán.",
        400,
      );
    }

    return apiSuccessResponse({
      order: {
        id: updatedOrder.id,
        orderId: updatedOrder.order_id,
        amountVnd: updatedOrder.amount_vnd,
        credits: updatedOrder.credits,
        bonusCredits: updatedOrder.bonus_credits,
        totalCredits: updatedOrder.total_credits,
        status: updatedOrder.status,
      },
      payment: {
        payUrl: momoResponse.payUrl ?? null,
        deeplink: momoResponse.deeplink ?? null,
        qrCodeUrl: momoResponse.qrCodeUrl ?? null,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
