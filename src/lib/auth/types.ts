export type ProfileRecord = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  workspace_name: string | null;
};

export type AuthUserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  workspaceName: string | null;
};
