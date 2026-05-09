import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client không được import ở client.");
  }

  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const createAdminSupabase = createAdminClient;
