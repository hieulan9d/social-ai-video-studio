import { AuthProvider } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import type { AuthUserProfile } from "@/lib/auth/types";
import type { Project } from "@/lib/projects/types";

export function AppShell({
  children,
  user,
  projects,
}: {
  children: React.ReactNode;
  user: AuthUserProfile;
  projects: Project[];
}) {
  return (
    <AuthProvider user={user}>
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <AppSidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <AppTopbar projects={projects} />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
