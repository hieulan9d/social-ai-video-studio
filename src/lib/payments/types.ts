export type PaymentProviderName = "mock" | "stripe" | "momo" | "vnpay";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentRecord = {
  id: string;
  user_id: string;
  wallet_id: string;
  credit_package_id: string | null;
  provider: string;
  provider_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  credits_purchased: number;
  metadata: Record<string, unknown>;
  checkout_url: string | null;
  return_url: string | null;
  provider_session_id: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  credited_at: string | null;
  webhook_event_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  userId: string;
  walletId: string;
  creditPackageId: string | null;
  provider: PaymentProviderName | string;
  providerPaymentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  creditsPurchased: number;
  metadata: Record<string, unknown>;
  checkoutUrl: string | null;
  returnUrl: string | null;
  providerSessionId: string | null;
  failureReason: string | null;
  paidAt: string | null;
  creditedAt: string | null;
  webhookEventId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentInput = {
  paymentId: string;
  userId: string;
  walletId: string;
  packageId: string;
  packageSlug: string;
  packageName: string;
  credits: number;
  amount: number;
  currency: string;
  returnUrl: string;
  webhookUrl: string;
};

export type CreatedPaymentSession = {
  checkoutUrl: string;
  providerPaymentId?: string | null;
  providerSessionId?: string | null;
  metadata?: Record<string, unknown>;
};

export type VerifiedWebhookEvent = {
  eventId: string;
  paymentId: string;
  providerPaymentId: string;
  providerSessionId?: string | null;
  status: "success" | "failed" | "pending";
  metadata?: Record<string, unknown>;
  failureReason?: string | null;
};

export function isPaymentProviderName(value: string): value is PaymentProviderName {
  return value === "mock" || value === "stripe" || value === "momo" || value === "vnpay";
}
