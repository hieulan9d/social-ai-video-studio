import { AppShell } from "@/components/layout/app-shell";
import { requireUserProfile } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUserProfile();

  return <AppShell user={user}>{children}</AppShell>;
}
