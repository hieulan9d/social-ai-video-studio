import "server-only";

import { createClient } from "@/lib/supabase/server";
import { AppError, ADMIN_REQUIRED_MESSAGE, AUTH_REQUIRED_MESSAGE } from "@/lib/errors";
import { getCurrentUserProfile } from "@/lib/auth/server";
import type { User } from "@supabase/supabase-js";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError(AUTH_REQUIRED_MESSAGE, 401);
  }

  return user;
}

export async function getCurrentProfile() {
  return getCurrentUserProfile();
}

export async function requireAdmin() {
  const user = await requireUser();
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "admin" || profile.accountStatus !== "active") {
    throw new AppError(ADMIN_REQUIRED_MESSAGE, 403);
  }

  return { user, profile };
}
