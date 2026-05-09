export type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  workspace_name: string | null;
  role: "user" | "admin";
  plan?: "free" | "pro" | "business";
  account_status: "active" | "suspended";
  onboarding_completed_at: string | null;
  onboarding_metadata: Record<string, unknown>;
};

export type AuthUserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  workspaceName: string | null;
  role: "user" | "admin";
  plan: "free" | "pro" | "business";
  accountStatus: "active" | "suspended";
  onboardingCompletedAt: string | null;
  onboardingMetadata: Record<string, unknown>;
};
