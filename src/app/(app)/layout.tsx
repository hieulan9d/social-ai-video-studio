import { AppShell } from "@/components/layout/app-shell";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUserProfile();
  const projects = await getProjects(user.id);

  return (
    <AppShell user={user} projects={projects}>
      {children}
    </AppShell>
  );
}
