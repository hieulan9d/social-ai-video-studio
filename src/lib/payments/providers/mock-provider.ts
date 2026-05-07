import crypto from "node:crypto";
import type {
  CreatePaymentInput,
  CreatedPaymentSession,
  VerifiedWebhookEvent,
} from "@/lib/payments/types";
import type {
  PaymentProvider,
  VerifyWebhookInput,
} from "@/lib/payments/providers/payment-provider";
import { getSiteUrl } from "@/lib/env";

type MockWebhookPayload = {
  eventId: string;
  paymentId: string;
  providerPaymentId: string;
  providerSessionId: string;
  status: "success" | "failed" | "pending";
  metadata?: Record<string, unknown>;
  failureReason?: string | null;
};

function getMockWebhookSecret() {
  return process.env.MOCK_PAYMENT_WEBHOOK_SECRET ?? "mock-webhook-secret";
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock" as const;

  async createPayment(input: CreatePaymentInput): Promise<CreatedPaymentSession> {
    const providerPaymentId = `mock_pay_${input.paymentId}`;
    const providerSessionId = `mock_session_${input.paymentId}`;
    const checkoutUrl = new URL(`/wallet/checkout/mock/${input.paymentId}`, getSiteUrl());

    return {
      checkoutUrl: checkoutUrl.toString(),
      providerPaymentId,
      providerSessionId,
      metadata: {
        package_slug: input.packageSlug,
      },
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent> {
    const expectedSignature = this.signPayload(input.rawBody);
    const receivedSignature = input.headers.get("x-mock-signature");

    if (!receivedSignature || receivedSignature !== expectedSignature) {
      throw new Error("Invalid mock webhook signature.");
    }

    const payload = JSON.parse(input.rawBody) as MockWebhookPayload;

    return {
      eventId: payload.eventId,
      paymentId: payload.paymentId,
      providerPaymentId: payload.providerPaymentId,
      providerSessionId: payload.providerSessionId,
      status: payload.status,
      metadata: payload.metadata,
      failureReason: payload.failureReason ?? null,
    };
  }

  buildSuccessPayload(paymentId: string, providerPaymentId?: string | null) {
    const payload: MockWebhookPayload = {
      eventId: `mock_event_${paymentId}_success`,
      paymentId,
      providerPaymentId: providerPaymentId ?? `mock_pay_${paymentId}`,
      providerSessionId: `mock_session_${paymentId}`,
      status: "success",
      metadata: {
        source: "mock-checkout",
      },
    };

    const rawBody = JSON.stringify(payload);

    return {
      rawBody,
      signature: this.signPayload(rawBody),
    };
  }

  private signPayload(rawBody: string) {
    return crypto
      .createHmac("sha256", getMockWebhookSecret())
      .update(rawBody)
      .digest("hex");
  }
}
