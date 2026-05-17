import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/server";
import type { AuthUserProfile } from "@/lib/auth/types";

/**
 * Get authenticated user for API routes.
 * Unlike requireUserProfile(), this does NOT redirect — returns null instead.
 * Use in API routes where redirect would cause NEXT_REDIRECT errors.
 */
export async function getApiUser(): Promise<AuthUserProfile | null> {
  try {
    return await getCurrentUserProfile();
  } catch {
    return null;
  }
}

/**
 * Require authenticated user for API routes.
 * Returns the user or a 401 NextResponse.
 */
export async function requireApiUser(): Promise<
  | { user: AuthUserProfile; error?: never }
  | { user?: never; error: NextResponse }
> {
  const user = await getApiUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}
