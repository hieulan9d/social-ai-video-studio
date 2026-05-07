"use server";

import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/auth/server";
import { getPaymentProvider } from "@/lib/payments/providers";
import { MockPaymentProvider } from "@/lib/payments/providers/mock-provider";
import {
  createTopUpPayment,
  getPaymentForUser,
  handleVerifiedWebhookEvent,
} from "@/lib/payments/server";
import type { PaymentProviderName } from "@/lib/payments/types";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function startCheckout(formData: FormData) {
  const user = await requireUserProfile();
  const packageId = readString(formData, "packageId");
  const providerName = readString(formData, "provider") as PaymentProviderName;

  const payment = await createTopUpPayment({
    userId: user.id,
    packageId,
    providerName,
  });

  redirect(payment.checkoutUrl || "/wallet");
}

export async function completeMockCheckout(formData: FormData) {
  const user = await requireUserProfile();
  const paymentId = readString(formData, "paymentId");
  const payment = await getPaymentForUser(paymentId, user.id);
  const provider = getPaymentProvider("mock");

  if (!(provider instanceof MockPaymentProvider)) {
    throw new Error("Mock provider is not available.");
  }

  const { rawBody, signature } = provider.buildSuccessPayload(
    payment.id,
    payment.providerPaymentId,
  );
  const event = await provider.verifyWebhook({
    headers: new Headers({
      "x-mock-signature": signature,
    }),
    rawBody,
    url: payment.checkoutUrl || "",
  });

  await handleVerifiedWebhookEvent({
    providerName: "mock",
    event,
  });

  redirect(`/wallet?paymentId=${payment.id}`);
}
