"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error: string | null;
  success: string | null;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
) {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const next = readString(formData, "next") || "/dashboard";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  redirect(next);
}

export async function registerWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
) {
  const email = readString(formData, "email");
  const password = readString(formData, "password");
  const fullName = readString(formData, "fullName");
  const workspaceName = readString(formData, "workspaceName");

  const supabase = await createClient();
  const redirectTo = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  redirectTo.searchParams.set("next", "/dashboard");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo.toString(),
      data: {
        full_name: fullName,
        workspace_name: workspaceName,
      },
    },
  });

  if (error) {
    return { error: error.message, success: null };
  }

  return {
    error: null,
    success:
      "Account created. If email confirmation is enabled in Supabase, check your inbox before logging in.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
