import type {
  CreatedPaymentSession,
  VerifiedWebhookEvent,
} from "@/lib/payments/types";
import type {
  PaymentProvider,
} from "@/lib/payments/providers/payment-provider";

export class StripeProvider implements PaymentProvider {
  readonly name = "stripe" as const;

  async createPayment(): Promise<CreatedPaymentSession> {
    throw new Error("StripeProvider is a placeholder and is not configured yet.");
  }

  async verifyWebhook(): Promise<VerifiedWebhookEvent> {
    throw new Error("StripeProvider webhook verification is not implemented yet.");
  }
}
