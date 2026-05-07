import type { PaymentStatus } from "@/lib/payments/types";
import type { FeaturePriceRecord } from "@/lib/pricing/types";

export type AdminUserRecord = {
  id: string;
  email: string;
  full_name: string | null;
  workspace_name: string | null;
  role: "user" | "admin";
  account_status: "active" | "suspended";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  wallets: Array<{
    id: string;
    balance_credit: number;
  }>;
};

export type AdminPaymentRecord = {
  id: string;
  user_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  credits_purchased: number;
  failure_reason: string | null;
  provider_payment_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    email: string;
  } | null;
};

export type AdminWalletRecord = {
  id: string;
  user_id: string;
  balance_credit: number;
  updated_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
};

export type AdminFailedRenderRecord = {
  id: string;
  project_id: string;
  user_id: string;
  status: "failed";
  provider: string | null;
  render_mode: string;
  credit_cost: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  profiles: {
    email: string;
  } | null;
  projects: {
    title: string;
  } | null;
};

export type AdminFailedExportRecord = {
  id: string;
  project_id: string;
  user_id: string;
  status: "failed";
  export_ratio: string;
  credit_cost: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  profiles: {
    email: string;
  } | null;
  projects: {
    title: string;
  } | null;
};

export type AdminCreditPackageRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  credits: number;
  price_amount: number;
  currency: string;
  is_active: boolean;
  updated_at: string;
};

export type AdminPromptTemplateRecord = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string | null;
  content: string;
  is_active: boolean;
  created_by: string | null;
  updated_at: string;
};

export type AdminAnalyticsEventRecord = {
  id: string;
  user_id: string | null;
  event_name: string;
  path: string | null;
  referrer: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles: {
    email: string;
  } | null;
};

export type AdminDashboardData = {
  users: AdminUserRecord[];
  payments: AdminPaymentRecord[];
  wallets: AdminWalletRecord[];
  failedRenders: AdminFailedRenderRecord[];
  failedExports: AdminFailedExportRecord[];
  creditPackages: AdminCreditPackageRecord[];
  featurePrices: FeaturePriceRecord[];
  templates: AdminPromptTemplateRecord[];
  analyticsEvents: AdminAnalyticsEventRecord[];
  metrics: {
    users: number;
    activeUsers: number;
    payments: number;
    failedJobs: number;
    walletCredits: number;
    pageViews: number;
  };
};
