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
  const baseSelect = "id, email, full_name, role, created_at, wallets(balance_credit)";
  let query = admin
    .from("profiles")
    .select(`id, email, full_name, role, plan, created_at, wallets(balance_credit)`, {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search?.trim()) {
    const normalized = search.trim().replace(/[,%]/g, "");
    query = query.or(`email.ilike.%${normalized}%,full_name.ilike.%${normalized}%`);
  }

  let { data, error, count } = await query.returns<AdminUserCreditRow[]>();

  if (error && error.code === "42703") {
    let fallbackQuery = admin
      .from("profiles")
      .select(baseSelect, { count: "exact" })
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

  return {
    items: (data ?? []).map((item) => ({
      id: item.id,
      email: item.email,
      full_name: item.full_name,
      role: item.role,
      plan: item.plan ?? "free",
      balance: item.wallets?.[0]?.balance_credit ?? 0,
      total_added: 0,
      total_used: 0,
      created_at: item.created_at,
    })),
    count: count ?? 0,
  };
}
