export type UserRole = "user" | "admin";
export type UserPlan = "free" | "pro" | "business";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  plan: UserPlan;
  created_at: string;
  updated_at: string;
};

export type UserCredits = {
  id: string;
  user_id: string;
  balance: number;
  total_added: number;
  total_used: number;
  created_at: string;
  updated_at: string;
};

export type CreditTransactionType = "add" | "use" | "refund" | "adjust" | "bonus";

export type CreditTransaction = {
  id: string;
  user_id: string;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
