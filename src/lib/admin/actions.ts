"use server";

import { revalidatePath } from "next/cache";
import {
  manuallyRefundCredits,
  markFailedExportReviewed,
  markFailedRenderReviewed,
  updateAdminPayment,
  updateAdminUser,
  updateFeaturePrice,
  upsertCreditPackage,
  upsertPromptTemplate,
} from "@/lib/admin/server";
import type { PaymentStatus } from "@/lib/payments/types";
import { isFeaturePriceKey } from "@/lib/pricing/types";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function readPositiveInt(formData: FormData, key: string) {
  const value = Number.parseInt(readString(formData, key), 10);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} must be greater than zero.`);
  }

  return value;
}

function readNonNegativeNumber(formData: FormData, key: string) {
  const value = Number.parseFloat(readString(formData, key));

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be zero or greater.`);
  }

  return value;
}

export async function updateAdminUserAction(formData: FormData) {
  const userId = readString(formData, "userId");
  const role = readString(formData, "role");
  const accountStatus = readString(formData, "accountStatus");

  if (!userId || (role !== "user" && role !== "admin")) {
    throw new Error("Valid user and role are required.");
  }

  if (accountStatus !== "active" && accountStatus !== "suspended") {
    throw new Error("Valid account status is required.");
  }

  await updateAdminUser({
    userId,
    role,
    accountStatus,
    adminNotes: readString(formData, "adminNotes") || null,
  });

  revalidatePath("/admin");
}

export async function manualRefundCreditsAction(formData: FormData) {
  const userId = readString(formData, "userId");
  const reason = readString(formData, "reason");

  if (!userId || !reason) {
    throw new Error("User and refund reason are required.");
  }

  await manuallyRefundCredits({
    userId,
    amount: readPositiveInt(formData, "amount"),
    reason,
    referenceId: readString(formData, "referenceId") || null,
  });

  revalidatePath("/admin");
}

export async function updateAdminPaymentAction(formData: FormData) {
  const paymentId = readString(formData, "paymentId");
  const status = readString(formData, "status") as PaymentStatus;
  const allowedStatuses: PaymentStatus[] = [
    "pending",
    "processing",
    "success",
    "failed",
    "refunded",
    "cancelled",
  ];

  if (!paymentId || !allowedStatuses.includes(status)) {
    throw new Error("Valid payment and status are required.");
  }

  await updateAdminPayment({
    paymentId,
    status,
    failureReason: readString(formData, "failureReason") || null,
  });

  revalidatePath("/admin");
}

export async function markFailedRenderReviewedAction(formData: FormData) {
  const jobId = readString(formData, "jobId");

  if (!jobId) {
    throw new Error("Render job is required.");
  }

  await markFailedRenderReviewed({
    jobId,
    note: readString(formData, "note") || "Reviewed by admin.",
  });

  revalidatePath("/admin");
}

export async function markFailedExportReviewedAction(formData: FormData) {
  const jobId = readString(formData, "jobId");

  if (!jobId) {
    throw new Error("Export job is required.");
  }

  await markFailedExportReviewed({
    jobId,
    note: readString(formData, "note") || "Reviewed by admin.",
  });

  revalidatePath("/admin");
}

export async function upsertCreditPackageAction(formData: FormData) {
  const slug = readString(formData, "slug");
  const name = readString(formData, "name");
  const currency = readString(formData, "currency") || "USD";

  if (!slug || !name) {
    throw new Error("Package slug and name are required.");
  }

  await upsertCreditPackage({
    id: readString(formData, "id") || undefined,
    slug,
    name,
    description: readString(formData, "description") || null,
    credits: readPositiveInt(formData, "credits"),
    priceAmount: readNonNegativeNumber(formData, "priceAmount"),
    currency,
    isActive: readBoolean(formData, "isActive"),
  });

  revalidatePath("/admin");
  revalidatePath("/wallet");
}

export async function updateFeaturePriceAction(formData: FormData) {
  const featureKey = readString(formData, "featureKey");
  const name = readString(formData, "name");

  if (!isFeaturePriceKey(featureKey) || !name) {
    throw new Error("Feature key and name are required.");
  }

  await updateFeaturePrice({
    featureKey,
    name,
    description: readString(formData, "description") || null,
    creditCost: readNonNegativeNumber(formData, "creditCost"),
    isActive: readBoolean(formData, "isActive"),
  });

  revalidatePath("/admin");
}

export async function upsertPromptTemplateAction(formData: FormData) {
  const slug = readString(formData, "slug");
  const name = readString(formData, "name");
  const category = readString(formData, "category") || "general";
  const content = readString(formData, "content");

  if (!slug || !name || !content) {
    throw new Error("Template slug, name, and content are required.");
  }

  await upsertPromptTemplate({
    id: readString(formData, "id") || undefined,
    slug,
    name,
    category,
    description: readString(formData, "description") || null,
    content,
    isActive: readBoolean(formData, "isActive"),
  });

  revalidatePath("/admin");
}
