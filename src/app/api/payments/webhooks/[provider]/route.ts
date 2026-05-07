import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/providers";
import { handleVerifiedWebhookEvent } from "@/lib/payments/server";
import { isPaymentProviderName } from "@/lib/payments/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;

    if (!isPaymentProviderName(provider)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported payment provider.",
        },
        { status: 404 },
      );
    }

    const paymentProvider = getPaymentProvider(provider);
    const rawBody = await request.text();
    const event = await paymentProvider.verifyWebhook({
      headers: request.headers,
      rawBody,
      url: request.url,
    });

    const payment = await handleVerifiedWebhookEvent({
      providerName: provider,
      event,
    });

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      status: payment.status,
      creditedAt: payment.creditedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook processing failed.",
      },
      { status: 400 },
    );
  }
}
