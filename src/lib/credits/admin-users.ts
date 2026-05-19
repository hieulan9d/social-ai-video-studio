import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserCreditRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  plan?: "free" | "pro" | "business";
  created_at: string;
  wallets: Array<{
    balance_credit: number;
  }> | null;
};

export async function listAdminUsers({
  search,
  page,
  limit,
}: {
  search?: string;
  page: number;
  limit: number;
}) {
  const admin = createAdminClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("profiles")
    .select("id, email, full_name, role, plan, created_at, wallets(balance_credit)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search?.trim()) {
    const normalized = search.trim().replace(/[,%]/g, "");
    query = query.or(`email.ilike.%${normalized}%,full_name.ilike.%${normalized}%`);
  }

  let { data, error, count } = await query.returns<AdminUserCreditRow[]>();

  // Fallback if 'plan' column doesn't exist
  if (error && error.code === "42703") {
    let fallbackQuery = admin
      .from("profiles")
      .select("id, email, full_name, role, created_at, wallets(balance_credit)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search?.trim()) {
      const normalized = search.trim().replace(/[,%]/g, "");
      fallbackQuery = fallbackQuery.or(`email.ilike.%${normalized}%,full_name.ilike.%${normalized}%`);
    }

    const fallback = await fallbackQuery.returns<AdminUserCreditRow[]>();
    data = fallback.data;
    error = fallback.error;
    count = fallback.count;
  }

  if (error) {
    throw error;
  }

  // If join didn't return wallet data, fetch wallets separately
  const items = data ?? [];
  const needsWalletFetch = items.some((item) => !item.wallets || item.wallets.length === 0);

  let walletMap = new Map<string, number>();
  if (needsWalletFetch) {
    const userIds = items.map((item) => item.id);
    const { data: wallets } = await admin
      .from("wallets")
      .select("user_id, balance_credit")
      .in("user_id", userIds);

    for (const w of wallets ?? []) {
      walletMap.set(w.user_id, w.balance_credit);
    }
  }

  return {
    items: items.map((item) => {
      const balanceFromJoin = item.wallets?.[0]?.balance_credit;
      const balance = balanceFromJoin ?? walletMap.get(item.id) ?? 0;

      return {
        id: item.id,
        email: item.email,
        full_name: item.full_name,
        role: item.role,
        plan: item.plan ?? "free",
        balance,
        total_added: 0,
        total_used: 0,
        created_at: item.created_at,
      };
    }),
    count: count ?? 0,
  };
}
