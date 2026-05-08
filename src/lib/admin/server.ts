import "server-only";

import { requireAdminProfile } from "@/lib/auth/server";
import {
  normalizeFeatureCreditCost,
  normalizeFeaturePriceRecord,
} from "@/lib/pricing/policy";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminCreditPackageRecord,
  AdminAnalyticsEventRecord,
  AdminDashboardData,
  AdminFailedExportRecord,
  AdminFailedRenderRecord,
  AdminPaymentRecord,
  AdminPromptTemplateRecord,
  AdminUserRecord,
  AdminWalletRecord,
} from "@/lib/admin/types";
import type { PaymentStatus } from "@/lib/payments/types";
import {
  isFeaturePriceKey,
  type FeaturePriceKey,
  type FeaturePriceRecord,
} from "@/lib/pricing/types";
import type { WalletMutationResultRecord } from "@/lib/wallet/types";

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await requireAdminProfile();

  const admin = createAdminClient();
  const [
    usersResult,
    paymentsResult,
    walletsResult,
    renderJobsResult,
    exportJobsResult,
    packagesResult,
    featurePricesResult,
    templatesResult,
    analyticsEventsResult,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "id, email, full_name, workspace_name, role, account_status, admin_notes, created_at, updated_at, wallets(id, balance_credit)",
      )
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<AdminUserRecord[]>(),
    admin
      .from("payments")
      .select(
        "id, user_id, provider, amount, currency, status, credits_purchased, failure_reason, provider_payment_id, created_at, updated_at, profiles(email)",
      )
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<AdminPaymentRecord[]>(),
    admin
      .from("wallets")
      .select("id, user_id, balance_credit, updated_at, profiles(email, full_name)")
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<AdminWalletRecord[]>(),
    admin
      .from("render_jobs")
      .select(
        "id, project_id, user_id, status, provider, render_mode, credit_cost, error_message, metadata, created_at, updated_at, profiles(email), projects(title)",
      )
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(30)
      .returns<AdminFailedRenderRecord[]>(),
    admin
      .from("export_jobs")
      .select(
        "id, project_id, user_id, status, export_ratio, credit_cost, error_message, metadata, created_at, updated_at, profiles(email), projects(title)",
      )
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(30)
      .returns<AdminFailedExportRecord[]>(),
    admin
      .from("credit_packages")
      .select(
        "id, slug, name, description, credits, price_amount, currency, is_active, updated_at",
      )
      .order("credits", { ascending: true })
      .returns<AdminCreditPackageRecord[]>(),
    admin
      .from("feature_pricing")
      .select(
        "id, feature_key, name, description, credit_cost, is_active, metadata, created_at, updated_at",
      )
      .order("name", { ascending: true })
      .returns<FeaturePriceRecord[]>(),
    admin
      .from("prompt_templates")
      .select(
        "id, slug, name, category, description, content, is_active, created_by, updated_at",
      )
      .order("updated_at", { ascending: false })
      .limit(50)
      .returns<AdminPromptTemplateRecord[]>(),
    admin
      .from("analytics_events")
      .select("id, user_id, event_name, path, referrer, metadata, created_at, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<AdminAnalyticsEventRecord[]>(),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (paymentsResult.error) throw paymentsResult.error;
  if (walletsResult.error) throw walletsResult.error;
  if (renderJobsResult.error) throw renderJobsResult.error;
  if (exportJobsResult.error) throw exportJobsResult.error;
  if (packagesResult.error) throw packagesResult.error;
  if (featurePricesResult.error) throw featurePricesResult.error;
  if (templatesResult.error) throw templatesResult.error;
  if (analyticsEventsResult.error) throw analyticsEventsResult.error;

  return {
    users: usersResult.data,
    payments: paymentsResult.data,
    wallets: walletsResult.data,
    failedRenders: renderJobsResult.data,
    failedExports: exportJobsResult.data,
    creditPackages: packagesResult.data,
    featurePrices: featurePricesResult.data.map(normalizeFeaturePriceRecord),
    templates: templatesResult.data,
    analyticsEvents: analyticsEventsResult.data,
    metrics: {
      users: usersResult.data.length,
      activeUsers: usersResult.data.filter(
        (user) => user.account_status === "active",
      ).length,
      payments: paymentsResult.data.length,
      failedJobs: renderJobsResult.data.length + exportJobsResult.data.length,
      walletCredits: walletsResult.data.reduce(
        (total, wallet) => total + wallet.balance_credit,
        0,
      ),
      pageViews: analyticsEventsResult.data.filter(
        (event) => event.event_name === "page_view",
      ).length,
    },
  };
}

export async function updateFeaturePrice(input: {
  featureKey: FeaturePriceKey;
  name: string;
  description?: string | null;
  creditCost: number;
  isActive: boolean;
}) {
  await requireAdminProfile();

  if (!isFeaturePriceKey(input.featureKey)) {
    throw new Error("Invalid feature pricing key.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("feature_pricing")
    .update({
      name: input.name,
      description: input.description ?? null,
      credit_cost: normalizeFeatureCreditCost(input.featureKey, input.creditCost),
      is_active: input.isActive,
    })
    .eq("feature_key", input.featureKey);

  if (error) throw error;
}

export async function updateAdminUser(input: {
  userId: string;
  role: "user" | "admin";
  accountStatus: "active" | "suspended";
  adminNotes?: string | null;
}) {
  await requireAdminProfile();

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      role: input.role,
      account_status: input.accountStatus,
      admin_notes: input.adminNotes ?? null,
    })
    .eq("id", input.userId);

  if (error) throw error;
}

export async function manuallyRefundCredits(input: {
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string | null;
}) {
  const adminUser = await requireAdminProfile();
  const admin = createAdminClient();

  const { data, error } = await admin
    .rpc("refund_credits", {
      p_user_id: input.userId,
      p_amount: Math.abs(Math.trunc(input.amount)),
      p_reason: input.reason,
      p_reference_type: "admin_manual_refund",
      p_reference_id: input.referenceId || crypto.randomUUID(),
      p_metadata: {
        admin_user_id: adminUser.id,
        manual: true,
      },
    })
    .single<WalletMutationResultRecord>();

  if (error) {
    throw error;
  }

  return data;
}

async function getPaymentMetadata(paymentId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("metadata")
    .eq("id", paymentId)
    .single<{ metadata: Record<string, unknown> }>();

  if (error) {
    throw error;
  }

  return data.metadata ?? {};
}

export async function updateAdminPayment(input: {
  paymentId: string;
  status: PaymentStatus;
  failureReason?: string | null;
}) {
  await requireAdminProfile();

  const admin = createAdminClient();
  const metadata = await getPaymentMetadata(input.paymentId);
  const { error } = await admin
    .from("payments")
    .update({
      status: input.status,
      failure_reason: input.failureReason ?? null,
      metadata: {
        ...metadata,
        admin_updated: true,
        admin_updated_at: new Date().toISOString(),
      },
    })
    .eq("id", input.paymentId);

  if (error) throw error;
}

export async function markFailedRenderReviewed(input: {
  jobId: string;
  note: string;
}) {
  const adminUser = await requireAdminProfile();
  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("render_jobs")
    .select("metadata")
    .eq("id", input.jobId)
    .single<{ metadata: Record<string, unknown> }>();

  if (fetchError) throw fetchError;

  const { error } = await admin
    .from("render_jobs")
    .update({
      metadata: {
        ...(data.metadata ?? {}),
        admin_reviewed: true,
        admin_review_note: input.note,
        admin_reviewed_by: adminUser.id,
        admin_reviewed_at: new Date().toISOString(),
      },
    })
    .eq("id", input.jobId);

  if (error) throw error;
}

export async function markFailedExportReviewed(input: {
  jobId: string;
  note: string;
}) {
  const adminUser = await requireAdminProfile();
  const admin = createAdminClient();
  const { data, error: fetchError } = await admin
    .from("export_jobs")
    .select("metadata")
    .eq("id", input.jobId)
    .single<{ metadata: Record<string, unknown> }>();

  if (fetchError) throw fetchError;

  const { error } = await admin
    .from("export_jobs")
    .update({
      metadata: {
        ...(data.metadata ?? {}),
        admin_reviewed: true,
        admin_review_note: input.note,
        admin_reviewed_by: adminUser.id,
        admin_reviewed_at: new Date().toISOString(),
      },
    })
    .eq("id", input.jobId);

  if (error) throw error;
}

export async function upsertCreditPackage(input: {
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  credits: number;
  priceAmount: number;
  currency: string;
  isActive: boolean;
}) {
  await requireAdminProfile();

  const admin = createAdminClient();
  const payload = {
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    credits: input.credits,
    price_amount: input.priceAmount,
    currency: input.currency,
    is_active: input.isActive,
  };
  const query = input.id
    ? admin.from("credit_packages").update(payload).eq("id", input.id)
    : admin.from("credit_packages").insert(payload);
  const { error } = await query;

  if (error) throw error;
}

export async function upsertPromptTemplate(input: {
  id?: string;
  slug: string;
  name: string;
  category: string;
  description?: string | null;
  content: string;
  isActive: boolean;
}) {
  const adminUser = await requireAdminProfile();

  const admin = createAdminClient();
  const payload = {
    slug: input.slug,
    name: input.name,
    category: input.category,
    description: input.description ?? null,
    content: input.content,
    is_active: input.isActive,
    created_by: adminUser.id,
  };
  const query = input.id
    ? admin.from("prompt_templates").update(payload).eq("id", input.id)
    : admin.from("prompt_templates").insert(payload);
  const { error } = await query;

  if (error) throw error;
}
