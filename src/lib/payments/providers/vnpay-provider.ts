import type {
  CreatedPaymentSession,
  VerifiedWebhookEvent,
} from "@/lib/payments/types";
import type {
  PaymentProvider,
} from "@/lib/payments/providers/payment-provider";

export class VNPayProvider implements PaymentProvider {
  readonly name = "vnpay" as const;

  async createPayment(): Promise<CreatedPaymentSession> {
    throw new Error("VNPayProvider is a placeholder and is not configured yet.");
  }

  async verifyWebhook(): Promise<VerifiedWebhookEvent> {
    throw new Error("VNPayProvider webhook verification is not implemented yet.");
  }
}
