import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments/providers";
import type {
  CreatePaymentInput,
  Payment,
  PaymentProviderName,
  PaymentRecord,
  PaymentStatus,
} from "@/lib/payments/types";
import type { CreditPackage } from "@/lib/wallet/types";
import { getUserWallet } from "@/lib/wallet/server";

function isCancelledQueryError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "57014"
  );
}

function mapPayment(record: PaymentRecord): Payment {
  return {
    id: record.id,
    userId: record.user_id,
    walletId: record.wallet_id,
    creditPackageId: record.credit_package_id,
    provider: record.provider,
    providerPaymentId: record.provider_payment_id,
    amount: Number(record.amount),
    currency: record.currency,
    status: record.status,
    creditsPurchased: record.credits_purchased,
    metadata: record.metadata,
    checkoutUrl: record.checkout_url,
    returnUrl: record.return_url,
    providerSessionId: record.provider_session_id,
    failureReason: record.failure_reason,
    paidAt: record.paid_at,
    creditedAt: record.credited_at,
    webhookEventId: record.webhook_event_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export const getCreditPackageById = cache(async (packageId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_packages")
    .select("id, slug, name, description, credits, price_amount, currency, is_active")
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (error) {
    if (isCancelledQueryError(error)) {
      return [];
    }

    throw error;
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    credits: data.credits,
    priceAmount: Number(data.price_amount),
    currency: data.currency,
    isActive: data.is_active,
  } as CreditPackage;
});

export const getPaymentHistory = cache(async (userId: string, limit = 12) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, user_id, wallet_id, credit_package_id, provider, provider_payment_id, amount, currency, status, credits_purchased, metadata, checkout_url, return_url, provider_session_id, failure_reason, paid_at, credited_at, webhook_event_id, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<PaymentRecord[]>();

  if (error) {
    throw error;
  }

  return data.map(mapPayment);
});

export async function getPaymentForUser(paymentId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, user_id, wallet_id, credit_package_id, provider, provider_payment_id, amount, currency, status, credits_purchased, metadata, checkout_url, return_url, provider_session_id, failure_reason, paid_at, credited_at, webhook_event_id, created_at, updated_at",
    )
    .eq("id", paymentId)
    .eq("user_id", userId)
    .single<PaymentRecord>();

  if (error) {
    throw error;
  }

  return mapPayment(data);
}

export async function createTopUpPayment({
  userId,
  packageId,
  providerName,
}: {
  userId: string;
  packageId: string;
  providerName: PaymentProviderName;
}) {
  const [wallet, creditPackage] = await Promise.all([
    getUserWallet(userId),
    getCreditPackageById(packageId),
  ]);
  const admin = createAdminClient();
  const returnUrl = new URL("/wallet", getSiteUrl()).toString();

  const { data: insertedPayment, error: insertError } = await admin
    .from("payments")
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      credit_package_id: creditPackage.id,
      provider: providerName,
      amount: creditPackage.priceAmount,
      currency: creditPackage.currency,
      status: "pending" satisfies PaymentStatus,
      credits_purchased: creditPackage.credits,
      return_url: returnUrl,
      metadata: {
        package_slug: creditPackage.slug,
      },
    })
    .select(
      "id, user_id, wallet_id, credit_package_id, provider, provider_payment_id, amount, currency, status, credits_purchased, metadata, checkout_url, return_url, provider_session_id, failure_reason, paid_at, credited_at, webhook_event_id, created_at, updated_at",
    )
    .single<PaymentRecord>();

  if (insertError) {
    throw insertError;
  }

  const provider = getPaymentProvider(providerName);
  const webhookUrl = new URL(`/api/payments/webhooks/${providerName}`, getSiteUrl()).toString();
  const createPaymentInput: CreatePaymentInput = {
    paymentId: insertedPayment.id,
    userId,
    walletId: wallet.id,
    packageId: creditPackage.id,
    packageSlug: creditPackage.slug,
    packageName: creditPackage.name,
    credits: creditPackage.credits,
    amount: creditPackage.priceAmount,
    currency: creditPackage.currency,
    returnUrl,
    webhookUrl,
  };
  const session = await provider.createPayment(createPaymentInput);

  const { data: updatedPayment, error: updateError } = await admin
    .from("payments")
    .update({
      checkout_url: session.checkoutUrl,
      provider_payment_id: session.providerPaymentId ?? null,
      provider_session_id: session.providerSessionId ?? null,
      metadata: {
        ...insertedPayment.metadata,
        ...(session.metadata ?? {}),
      },
    })
    .eq("id", insertedPayment.id)
    .select(
      "id, user_id, wallet_id, credit_package_id, provider, provider_payment_id, amount, currency, status, credits_purchased, metadata, checkout_url, return_url, provider_session_id, failure_reason, paid_at, credited_at, webhook_event_id, created_at, updated_at",
    )
    .single<PaymentRecord>();

  if (updateError) {
    throw updateError;
  }

  return mapPayment(updatedPayment);
}

export async function completePaymentSuccess({
  paymentId,
  provider,
  providerPaymentId,
  providerSessionId,
  webhookEventId,
  metadata,
}: {
  paymentId: string;
  provider: PaymentProviderName;
  providerPaymentId: string;
  providerSessionId?: string | null;
  webhookEventId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("complete_payment_success", {
      p_payment_id: paymentId,
      p_provider: provider,
      p_provider_payment_id: providerPaymentId,
      p_provider_session_id: providerSessionId ?? null,
      p_webhook_event_id: webhookEventId ?? null,
      p_metadata: metadata ?? {},
    })
    .single<PaymentRecord>();

  if (error) {
    throw error;
  }

  return mapPayment(data);
}

export async function markPaymentFailed({
  paymentId,
  provider,
  providerPaymentId,
  webhookEventId,
  failureReason,
  metadata,
}: {
  paymentId: string;
  provider: PaymentProviderName;
  providerPaymentId?: string | null;
  webhookEventId?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("mark_payment_failed", {
      p_payment_id: paymentId,
      p_provider: provider,
      p_provider_payment_id: providerPaymentId ?? null,
      p_webhook_event_id: webhookEventId ?? null,
      p_failure_reason: failureReason ?? null,
      p_metadata: metadata ?? {},
    })
    .single<PaymentRecord>();

  if (error) {
    throw error;
  }

  return mapPayment(data);
}

export async function handleVerifiedWebhookEvent({
  providerName,
  event,
}: {
  providerName: PaymentProviderName;
  event: {
    eventId: string;
    paymentId: string;
    providerPaymentId: string;
    providerSessionId?: string | null;
    status: "success" | "failed" | "pending";
    metadata?: Record<string, unknown>;
    failureReason?: string | null;
  };
}) {
  if (event.status === "success") {
    return completePaymentSuccess({
      paymentId: event.paymentId,
      provider: providerName,
      providerPaymentId: event.providerPaymentId,
      providerSessionId: event.providerSessionId ?? null,
      webhookEventId: event.eventId,
      metadata: event.metadata,
    });
  }

  if (event.status === "failed") {
    return markPaymentFailed({
      paymentId: event.paymentId,
      provider: providerName,
      providerPaymentId: event.providerPaymentId,
      webhookEventId: event.eventId,
      failureReason: event.failureReason,
      metadata: event.metadata,
    });
  }

  return getPaymentById(event.paymentId);
}

export async function getPaymentById(paymentId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select(
      "id, user_id, wallet_id, credit_package_id, provider, provider_payment_id, amount, currency, status, credits_purchased, metadata, checkout_url, return_url, provider_session_id, failure_reason, paid_at, credited_at, webhook_event_id, created_at, updated_at",
    )
    .eq("id", paymentId)
    .single<PaymentRecord>();

  if (error) {
    throw error;
  }

  return mapPayment(data);
}
