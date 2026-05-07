export type WalletRecord = {
  id: string;
  user_id: string;
  balance_credit: number;
  created_at: string;
  updated_at: string;
};

export type WalletSummary = {
  id: string;
  userId: string;
  balanceCredit: number;
  createdAt: string;
  updatedAt: string;
};

export type CreditTransactionRecord = {
  id: string;
  wallet_id: string;
  user_id: string;
  transaction_type: string;
  amount_credit: number;
  balance_before: number;
  balance_after: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CreditTransaction = {
  id: string;
  walletId: string;
  userId: string;
  transactionType: string;
  amountCredit: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreditPackageRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  price_amount: number;
  currency: string;
  is_active: boolean;
};

export type CreditPackage = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  priceAmount: number;
  currency: string;
  isActive: boolean;
};

export type WalletMutationResultRecord = {
  wallet_id: string;
  user_id: string;
  balance_credit: number;
  transaction_id: string;
  transaction_type: string;
  amount_credit: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type WalletMutationResult = {
  walletId: string;
  userId: string;
  balanceCredit: number;
  transactionId: string;
  transactionType: string;
  amountCredit: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};
