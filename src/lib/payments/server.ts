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
  PaymentStatus,
} from "@/lib/payments/types";
import type { CreditPackage } from "@/lib/wallet/types";
import { getUserWallet } from "@/lib/wallet/server";
import type { WalletMutationResultRecord } from "@/lib/wallet/types";

type CreditPackageRow = {
  id: string;
  name: string;
  credits: number;
  price_amount: number;
  is_active: boolean;
};

type PaymentOrderRecord = {
  id: string;
  user_id: string;
  package_id: string | null;
  provider: string;
  order_code: number;
  amount_vnd: number;
  credits: number;
  bonus_credits: number;
  total_credits: number;
  status: PaymentStatus;
  checkout_url: string | null;
  payment_link_id: string | null;
  transaction_id: string | null;
  raw_payload: Record<string, unknown>;
  paid_at: string | null;
  credited_at: string | null;
  created_at: string;
  updated_at: string;
};

const PAYMENT_ORDER_SELECT =
  "id, user_id, package_id, provider, order_code, amount_vnd, credits, bonus_credits, total_credits, status, checkout_url, payment_link_id, transaction_id, raw_payload, paid_at, credited_at, created_at, updated_at";

function createOrderCode() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function mapPayment(record: PaymentOrderRecord): Payment {
  return {
    id: record.id,
    userId: record.user_id,
    walletId: "",
    creditPackageId: record.package_id,
    provider: record.provider,
    providerPaymentId:
      record.transaction_id ?? record.payment_link_id ?? String(record.order_code),
    amount: Number(record.amount_vnd),
    currency: "VND",
    status: record.status,
    creditsPurchased: record.total_credits,
    metadata: record.raw_payload ?? {},
    checkoutUrl: record.checkout_url,
    returnUrl: record.checkout_url,
    providerSessionId: record.payment_link_id,
    failureReason: null,
    paidAt: record.paid_at,
    creditedAt: record.credited_at,
    webhookEventId: record.transaction_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export const getCreditPackageById = cache(async (packageId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_packages")
    .select("id, name, credits, price_amount, is_active")
    .eq("id", packageId)
    .eq("is_active", true)
    .single<CreditPackageRow>();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    slug: data.id,
    name: data.name,
    description: null,
    credits: data.credits,
    priceAmount: Number(data.price_amount),
    currency: "VND",
    isActive: data.is_active,
  } satisfies CreditPackage;
});

export const getPaymentHistory = cache(async (userId: string, limit = 12) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .select(PAYMENT_ORDER_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<PaymentOrderRecord[]>();

  if (error) {
    throw error;
  }

  return data.map(mapPayment);
});

export async function getPaymentForUser(paymentId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_orders")
    .select(PAYMENT_ORDER_SELECT)
    .eq("id", paymentId)
    .eq("user_id", userId)
    .single<PaymentOrderRecord>();

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
  const [wallet, creditPackage] = (await Promise.all([
    getUserWallet(userId),
    getCreditPackageById(packageId),
  ])) as [Awaited<ReturnType<typeof getUserWallet>>, CreditPackage];
  const admin = createAdminClient();
  const returnUrl = new URL("/wallet", getSiteUrl()).toString();
  const orderCode = createOrderCode();

  const { data: insertedPayment, error: insertError } = await admin
    .from("payment_orders")
    .insert({
      user_id: userId,
      package_id: creditPackage.id,
      provider: providerName,
      order_code: orderCode,
      amount_vnd: Math.trunc(creditPackage.priceAmount),
      credits: creditPackage.credits,
      bonus_credits: 0,
      total_credits: creditPackage.credits,
      status: "pending" satisfies PaymentStatus,
      raw_payload: {
        package_slug: creditPackage.slug,
      },
    })
    .select(PAYMENT_ORDER_SELECT)
    .single<PaymentOrderRecord>();

  if (insertError) {
    console.error("createTopUpPayment insert payment_orders failed:", insertError);
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
    .from("payment_orders")
    .update({
      checkout_url: session.checkoutUrl,
      transaction_id: session.providerPaymentId ?? null,
      payment_link_id: session.providerSessionId ?? null,
      raw_payload: {
        ...insertedPayment.raw_payload,
        ...(session.metadata ?? {}),
      },
    })
    .eq("id", insertedPayment.id)
    .select(PAYMENT_ORDER_SELECT)
    .single<PaymentOrderRecord>();

  if (updateError) {
    console.error("createTopUpPayment update payment_orders failed:", updateError);
    throw updateError;
  }

  return mapPayment(updatedPayment);
}

export async function completePaymentSuccess({
  paymentId,
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
  const payment = await getPaymentById(paymentId);

  if (payment.status === "credited" || payment.creditedAt) {
    return payment;
  }

  const paidAt = new Date().toISOString();
  const { error: paidError } = await admin
    .from("payment_orders")
    .update({
      status: "paid",
      paid_at: paidAt,
      transaction_id: providerPaymentId,
      payment_link_id: providerSessionId ?? payment.providerSessionId,
      raw_payload: {
        ...payment.metadata,
        ...(metadata ?? {}),
        webhook_event_id: webhookEventId,
      },
    })
    .eq("id", paymentId)
    .is("credit_transaction_id", null);

  if (paidError) {
    throw paidError;
  }

  const { data: creditResult, error: creditError } = await admin
    .rpc("add_credits", {
      p_user_id: payment.userId,
      p_amount: payment.creditsPurchased,
      p_reason: "Nạp credit qua thanh toán",
      p_reference_type: "payment",
      p_reference_id: payment.id,
      p_metadata: {
        provider: payment.provider,
        providerPaymentId,
        webhookEventId,
      },
    })
    .single<WalletMutationResultRecord>();

  if (creditError && creditError.code !== "23505") {
    throw creditError;
  }

  await admin.rpc("sync_user_credits_from_wallet", {
    p_user_id: payment.userId,
  });

  const { data: updatedPayment, error: updateError } = await admin
    .from("payment_orders")
    .update({
      status: "credited",
      paid_at: paidAt,
      credited_at: new Date().toISOString(),
      credit_transaction_id: creditResult?.transaction_id ?? null,
      transaction_id: providerPaymentId,
    })
    .eq("id", paymentId)
    .select(PAYMENT_ORDER_SELECT)
    .single<PaymentOrderRecord>();

  if (updateError) {
    throw updateError;
  }

  return mapPayment(updatedPayment);
}

export async function markPaymentFailed({
  paymentId,
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
  const payment = await getPaymentById(paymentId);
  const { data, error } = await admin
    .from("payment_orders")
    .update({
      status: "failed",
      transaction_id: providerPaymentId ?? payment.providerPaymentId,
      raw_payload: {
        ...payment.metadata,
        ...(metadata ?? {}),
        webhook_event_id: webhookEventId,
        failure_reason: failureReason ?? null,
      },
    })
    .eq("id", paymentId)
    .select(PAYMENT_ORDER_SELECT)
    .single<PaymentOrderRecord>();

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
    .from("payment_orders")
    .select(PAYMENT_ORDER_SELECT)
    .eq("id", paymentId)
    .single<PaymentOrderRecord>();

  if (error) {
    throw error;
  }

  return mapPayment(data);
}
