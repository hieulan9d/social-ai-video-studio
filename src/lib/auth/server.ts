import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AuthUserProfile, ProfileRecord } from "@/lib/auth/types";

function toProfilePayload(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  return {
    id: user.id,
    email: user.email ?? "",
    full_name:
      asOptionalString(user.user_metadata?.full_name) ??
      asOptionalString(user.user_metadata?.name),
    avatar_url: asOptionalString(user.user_metadata?.avatar_url),
    workspace_name: asOptionalString(user.user_metadata?.workspace_name),
  };
}

function mapProfile(profile: ProfileRecord): AuthUserProfile {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    workspaceName: profile.workspace_name,
  };
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: existingProfile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, workspace_name")
    .eq("id", user.id)
    .maybeSingle<ProfileRecord>();

  if (error) {
    throw error;
  }

  if (existingProfile) {
    return mapProfile(existingProfile);
  }

  const profilePayload = toProfilePayload(user);
  const { data: createdProfile, error: createError } = await supabase
    .from("profiles")
    .upsert(profilePayload)
    .select("id, email, full_name, avatar_url, workspace_name")
    .single<ProfileRecord>();

  if (createError) {
    throw createError;
  }

  return mapProfile(createdProfile);
}

export async function requireUserProfile() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/auth");
  }

  return profile;
}
