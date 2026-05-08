import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AuthUserProfile } from "@/lib/auth/types";

const ADMIN_TEST_BALANCE = 999_999_999;

export function isAdminProfile(profile: Pick<AuthUserProfile, "role" | "accountStatus">) {
  return profile.role === "admin" && profile.accountStatus === "active";
}

export function getAdminTestBalance() {
  return ADMIN_TEST_BALANCE;
}

export function getConfiguredAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getConfiguredAdminEmails().includes(email.trim().toLowerCase());
}

export async function ensureConfiguredAdminRole({
  userId,
  email,
  currentRole,
}: {
  userId: string;
  email: string;
  currentRole: AuthUserProfile["role"];
}) {
  if (currentRole === "admin" || !isConfiguredAdminEmail(email)) {
    return currentRole;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin", account_status: "active" })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  return "admin" as const;
}

export async function isAdminUserId(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role, account_status")
    .eq("id", userId)
    .maybeSingle<{
      role: AuthUserProfile["role"];
      account_status: AuthUserProfile["accountStatus"];
    }>();

  if (error) {
    throw error;
  }

  return data?.role === "admin" && data.account_status === "active";
}
