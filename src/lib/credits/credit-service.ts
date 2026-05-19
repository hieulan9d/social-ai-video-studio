import "server-only";

import { env } from "@/lib/env";
import { AppError, INSUFFICIENT_CREDIT_MESSAGE } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreditTransactionType, UserCredits } from "@/types/user";

export type CreditActionType =
  | "prompt"
  | "image"
  | "voice"
  | "video_5s"
  | "video_10s"
  | "video_15s"
  | "custom";

export type UseCreditInput = {
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
};

export type CreditResult = {
  success: boolean;
  balance?: number;
  transactionId?: string;
  error?: string;
};

type RpcCreditResult = {
  success?: boolean;
  balance?: number;
  transaction_id?: string;
  error?: string;
};

type UserCreditsRow = {
  id: string;
  user_id: string;
  balance: number;
  total_added: number;
  total_used: number;
  created_at: string;
  updated_at: string;
};

export function getCreditCost(actionType: CreditActionType, customAmount?: number): number {
  if (actionType === "custom") {
    if (
      typeof customAmount !== "number" ||
      !Number.isInteger(customAmount) ||
      customAmount <= 0
    ) {
      throw new AppError("Chi phí credit tuỳ chỉnh không hợp lệ.", 400);
    }

    return customAmount;
  }

  const costs: Record<Exclude<CreditActionType, "custom">, number> = {
    prompt: env.costs.prompt,
    image: env.costs.image,
    voice: env.costs.voice,
    video_5s: env.costs.video5s,
    video_10s: env.costs.video10s,
    video_15s: env.costs.video15s,
  };

  return costs[actionType] ?? 1;
}

export function getVideoCreditCost(durationSeconds: number) {
  const duration = Math.max(1, Math.trunc(durationSeconds || 5));

  if (duration <= 5) return getCreditCost("video_5s");
  if (duration <= 10) return getCreditCost("video_10s");
  if (duration <= 15) return getCreditCost("video_15s");

  return Math.ceil(duration / 5) * getCreditCost("video_5s");
}

export async function getUserCredits(userId: string): Promise<UserCredits> {
  const admin = createAdminClient();

  // Query wallets table (actual DB schema)
  const { data: walletData, error: walletError } = await admin
    .from("wallets")
    .select("id, user_id, balance_credit, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (walletError) {
    console.error("getUserCredits wallets query failed:", walletError);
    throw walletError;
  }

  if (!walletData) {
    return {
      id: "",
      user_id: userId,
      balance: 0,
      total_added: 0,
      total_used: 0,
      created_at: "",
      updated_at: "",
    };
  }

  // Calculate totals from credit_transactions
  const { data: txData } = await admin
    .from("credit_transactions")
    .select("transaction_type, amount_credit")
    .eq("user_id", userId);

  let totalAdded = 0;
  let totalUsed = 0;

  for (const tx of txData ?? []) {
    if (tx.amount_credit > 0) {
      totalAdded += tx.amount_credit;
    } else {
      totalUsed += Math.abs(tx.amount_credit);
    }
  }

  return {
    id: walletData.id,
    user_id: walletData.user_id,
    balance: walletData.balance_credit,
    total_added: totalAdded,
    total_used: totalUsed,
    created_at: walletData.created_at,
    updated_at: walletData.updated_at,
  };
}

export async function getUserCreditTransactions(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: CreditTransactionType | null;
  } = {},
) {
  const page = Math.max(1, Math.trunc(options.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.trunc(options.limit ?? 20)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();
  let query = admin
    .from("credit_transactions")
    .select("id, user_id, transaction_type, amount_credit, balance_after, reason, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.type) {
    const dbTypes = mapCreditTypeToDbTypes(options.type);
    if (dbTypes.length === 1) {
      query = query.eq("transaction_type", dbTypes[0]);
    } else {
      query = query.in("transaction_type", dbTypes);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("getUserCreditTransactions query failed:", error);
    throw error;
  }

  return (data ?? []).map((item: { id: string; user_id: string; transaction_type: string; amount_credit: number; balance_after: number; reason: string | null; metadata: Record<string, unknown>; created_at: string }) => ({
    id: item.id,
    user_id: item.user_id,
    type: mapTransactionType(item.transaction_type),
    amount: item.amount_credit,
    balance_after: item.balance_after,
    reason: item.reason,
    metadata: item.metadata,
    created_at: item.created_at,
  }));
}

function mapTransactionType(value: string): CreditTransactionType {
  const map: Record<string, CreditTransactionType> = {
    signup_bonus: "bonus",
    purchase: "add",
    deduction: "use",
    refund: "refund",
    adjustment: "adjust",
    admin_bypass_debit: "use",
    admin_bypass_refund: "refund",
  };

  return map[value] ?? "adjust";
}

function mapCreditTypeToDbTypes(type: CreditTransactionType): string[] {
  const map: Record<CreditTransactionType, string[]> = {
    bonus: ["signup_bonus"],
    add: ["purchase"],
    use: ["deduction", "admin_bypass_debit"],
    refund: ["refund", "admin_bypass_refund"],
    adjust: ["adjustment"],
  };

  return map[type] ?? [type];
}

export async function useCredits(input: UseCreditInput) {
  return callWalletRpc("deduct_credits", input);
}

export async function refundCredits(input: UseCreditInput) {
  return callWalletRpc("refund_credits", input);
}

export async function addCredits(input: UseCreditInput) {
  return callWalletRpc("add_credits", input);
}

export async function adjustCredits(input: {
  userId: string;
  newBalance: number;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<CreditResult> {
  if (!Number.isInteger(input.newBalance) || input.newBalance < 0) {
    throw new AppError("Số dư mới không hợp lệ.", 400);
  }

  // Get current balance then add/deduct the difference
  const credits = await getUserCredits(input.userId);
  const diff = input.newBalance - credits.balance;

  if (diff === 0) {
    return { success: true, balance: credits.balance };
  }

  if (diff > 0) {
    return callWalletRpc("add_credits", {
      userId: input.userId,
      amount: diff,
      reason: input.reason,
      metadata: { ...input.metadata, adjustment: true, previous_balance: credits.balance },
    });
  }

  return callWalletRpc("deduct_credits", {
    userId: input.userId,
    amount: Math.abs(diff),
    reason: input.reason,
    metadata: { ...input.metadata, adjustment: true, previous_balance: credits.balance },
  });
}

async function callWalletRpc(
  functionName: "add_credits" | "deduct_credits" | "refund_credits",
  input: UseCreditInput,
): Promise<CreditResult> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new AppError("Số credit phải là số nguyên lớn hơn 0.", 400);
  }

  const admin = createAdminClient();

  // Get current wallet
  const { data: wallet, error: walletError } = await admin
    .from("wallets")
    .select("id, user_id, balance_credit")
    .eq("user_id", input.userId)
    .single();

  if (walletError || !wallet) {
    console.error(`${functionName} wallet lookup failed:`, walletError);
    return { success: false, error: "Không tìm thấy ví credit." };
  }

  // Calculate new balance
  let newBalance: number;
  let transactionType: string;
  let amountCredit: number;

  if (functionName === "add_credits") {
    newBalance = wallet.balance_credit + input.amount;
    transactionType = "purchase";
    amountCredit = input.amount;
  } else if (functionName === "deduct_credits") {
    if (wallet.balance_credit < input.amount) {
      return { success: false, error: INSUFFICIENT_CREDIT_MESSAGE };
    }
    newBalance = wallet.balance_credit - input.amount;
    transactionType = "deduction";
    amountCredit = -input.amount;
  } else {
    // refund
    newBalance = wallet.balance_credit + input.amount;
    transactionType = "refund";
    amountCredit = input.amount;
  }

  // Update wallet balance
  const { error: updateError } = await admin
    .from("wallets")
    .update({ balance_credit: newBalance })
    .eq("id", wallet.id);

  if (updateError) {
    console.error(`${functionName} wallet update failed:`, updateError);
    return { success: false, error: "Không thể cập nhật ví." };
  }

  // Insert transaction record
  const { data: tx, error: txError } = await admin
    .from("credit_transactions")
    .insert({
      wallet_id: wallet.id,
      user_id: input.userId,
      transaction_type: transactionType,
      amount_credit: amountCredit,
      balance_before: wallet.balance_credit,
      balance_after: newBalance,
      reason: input.reason || null,
      reference_type: (input.metadata?.reference_type as string) || null,
      reference_id: (input.metadata?.reference_id as string) || null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (txError) {
    console.error(`${functionName} transaction insert failed:`, txError);
    // Wallet already updated, log but don't fail
  }

  return {
    success: true,
    balance: newBalance,
    transactionId: tx?.id ?? undefined,
  };
}




