import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdminTestBalance, isAdminUserId } from "@/lib/auth/permissions";
import type {
  CreditPackage,
  CreditPackageRecord,
  CreditTransaction,
  CreditTransactionRecord,
  WalletMutationResult,
  WalletMutationResultRecord,
  WalletRecord,
  WalletSummary,
} from "@/lib/wallet/types";

function mapWallet(record: WalletRecord): WalletSummary {
  return {
    id: record.id,
    userId: record.user_id,
    balanceCredit: record.balance_credit,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapTransaction(record: CreditTransactionRecord): CreditTransaction {
  return {
    id: record.id,
    walletId: record.wallet_id,
    userId: record.user_id,
    transactionType: record.transaction_type,
    amountCredit: record.amount_credit,
    balanceBefore: record.balance_before,
    balanceAfter: record.balance_after,
    reason: record.reason,
    referenceType: record.reference_type,
    referenceId: record.reference_id,
    metadata: record.metadata,
    createdAt: record.created_at,
  };
}

function mapPackage(record: CreditPackageRecord): CreditPackage {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    credits: record.credits,
    priceAmount: record.price_amount,
    currency: record.currency,
    isActive: record.is_active,
  };
}

function mapMutationResult(record: WalletMutationResultRecord): WalletMutationResult {
  return {
    walletId: record.wallet_id,
    userId: record.user_id,
    balanceCredit: record.balance_credit,
    transactionId: record.transaction_id,
    transactionType: record.transaction_type,
    amountCredit: record.amount_credit,
    reason: record.reason,
    referenceType: record.reference_type,
    referenceId: record.reference_id,
    metadata: record.metadata,
    createdAt: record.created_at,
  };
}

function isCancelledQueryError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "57014"
  );
}

export const getUserWallet = cache(async (userId: string) => {
  const supabase = await createClient();

  const { data: ensuredWallet, error: ensureError } = await supabase
    .rpc("ensure_wallet_for_user", {
      p_user_id: userId,
    })
    .single<WalletRecord>();

  if (ensureError) {
    if (isCancelledQueryError(ensureError)) {
      return {
        id: `fallback-wallet:${userId}`,
        userId,
        balanceCredit: await isAdminUserId(userId) ? getAdminTestBalance() : 0,
        createdAt: new Date(0).toISOString(),
        updatedAt: new Date(0).toISOString(),
      };
    }

    throw ensureError;
  }

  const wallet = mapWallet(ensuredWallet);

  if (await isAdminUserId(userId)) {
    return {
      ...wallet,
      balanceCredit: getAdminTestBalance(),
    };
  }

  return wallet;
});

export async function addCredits({
  userId,
  amount,
  reason,
  referenceType,
  referenceId,
  metadata,
}: {
  userId: string;
  amount: number;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return mutateCredits("add_credits", {
    userId,
    amount,
    reason,
    referenceType,
    referenceId,
    metadata,
  });
}

export async function deductCredits({
  userId,
  amount,
  reason,
  referenceType,
  referenceId,
  metadata,
}: {
  userId: string;
  amount: number;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return mutateCredits("deduct_credits", {
    userId,
    amount,
    reason,
    referenceType,
    referenceId,
    metadata,
  });
}

export async function refundCredits({
  userId,
  amount,
  reason,
  referenceType,
  referenceId,
  metadata,
}: {
  userId: string;
  amount: number;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return mutateCredits("refund_credits", {
    userId,
    amount,
    reason,
    referenceType,
    referenceId,
    metadata,
  });
}

async function mutateCredits(
  functionName: "add_credits" | "deduct_credits" | "refund_credits",
  {
    userId,
    amount,
    reason,
    referenceType,
    referenceId,
    metadata,
  }: {
    userId: string;
    amount: number;
    reason?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const supabase = await createClient();
  const normalizedAmount = Math.abs(Math.trunc(amount));

  if (
    (functionName === "deduct_credits" || functionName === "refund_credits") &&
    (await isAdminUserId(userId))
  ) {
    return {
      walletId: `admin-bypass:${userId}`,
      userId,
      balanceCredit: getAdminTestBalance(),
      transactionId: `admin-bypass:${functionName}:${referenceId ?? Date.now()}`,
      transactionType: functionName === "deduct_credits" ? "admin_bypass_debit" : "admin_bypass_refund",
      amountCredit: 0,
      reason: reason ?? "Admin bypass",
      referenceType: referenceType ?? "admin_bypass",
      referenceId: referenceId ?? null,
      metadata: {
        ...(metadata ?? {}),
        admin_bypass: true,
        requested_amount: amount,
      },
      createdAt: new Date().toISOString(),
    };
  }

  if (normalizedAmount <= 0) {
    throw new Error("Số tín dụng phải lớn hơn 0.");
  }

  const { data, error } = await supabase
    .rpc(functionName, {
      p_user_id: userId,
      p_amount: normalizedAmount,
      p_reason: reason ?? null,
      p_reference_type: referenceType ?? null,
      p_reference_id: referenceId ?? null,
      p_metadata: metadata ?? {},
    })
    .single<WalletMutationResultRecord>();

  if (error) {
    if (isCancelledQueryError(error)) {
      return [];
    }

    throw error;
  }

  return mapMutationResult(data);
}

export const getWalletTransactions = cache(async (userId: string, limit = 10) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select(
      "id, wallet_id, user_id, transaction_type, amount_credit, balance_before, balance_after, reason, reference_type, reference_id, metadata, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<CreditTransactionRecord[]>();

  if (error) {
    if (isCancelledQueryError(error)) {
      return [];
    }

    throw error;
  }

  return data.map(mapTransaction);
});

export const getCreditPackages = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_packages")
    .select("id, slug, name, description, credits, price_amount, currency, is_active")
    .eq("is_active", true)
    .order("credits", { ascending: true })
    .returns<CreditPackageRecord[]>();

  if (error) {
    throw error;
  }

  return data.map(mapPackage);
});
