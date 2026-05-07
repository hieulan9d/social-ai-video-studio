import type {
  CreatedPaymentSession,
  VerifiedWebhookEvent,
} from "@/lib/payments/types";
import type {
  PaymentProvider,
} from "@/lib/payments/providers/payment-provider";

export class MoMoProvider implements PaymentProvider {
  readonly name = "momo" as const;

  async createPayment(): Promise<CreatedPaymentSession> {
    throw new Error("MoMoProvider is a placeholder and is not configured yet.");
  }

  async verifyWebhook(): Promise<VerifiedWebhookEvent> {
    throw new Error("MoMoProvider webhook verification is not implemented yet.");
  }
}
