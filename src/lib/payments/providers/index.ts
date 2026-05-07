import { MockPaymentProvider } from "@/lib/payments/providers/mock-provider";
import { MoMoProvider } from "@/lib/payments/providers/momo-provider";
import type { PaymentProvider } from "@/lib/payments/providers/payment-provider";
import { StripeProvider } from "@/lib/payments/providers/stripe-provider";
import { VNPayProvider } from "@/lib/payments/providers/vnpay-provider";
import type { PaymentProviderName } from "@/lib/payments/types";

const providers: Record<PaymentProviderName, PaymentProvider> = {
  mock: new MockPaymentProvider(),
  stripe: new StripeProvider(),
  momo: new MoMoProvider(),
  vnpay: new VNPayProvider(),
};

export function getPaymentProvider(name: PaymentProviderName) {
  return providers[name];
}
