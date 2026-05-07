import type {
  CreatePaymentInput,
  CreatedPaymentSession,
  PaymentProviderName,
  VerifiedWebhookEvent,
} from "@/lib/payments/types";

export type VerifyWebhookInput = {
  headers: Headers;
  rawBody: string;
  url: string;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatedPaymentSession>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhookEvent>;
}
