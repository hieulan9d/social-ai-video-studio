"use client";

import { useState } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppShellBootstrap } from "@/components/layout/app-shell-bootstrap";
import { AppTopbar } from "@/components/layout/app-topbar";
import type { AuthUserProfile } from "@/lib/auth/types";

export function AppShell({
  children,
  user,
  credits,
}: {
  children: React.ReactNode;
  user: AuthUserProfile;
  credits: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthProvider user={user}>
      <AppShellBootstrap user={user} credits={credits} />
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto flex min-h-screen max-w-[1680px]">
          <AppSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <AppTopbar credits={credits} onOpenSidebar={() => setMobileOpen(true)} />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-6">
              <div className="space-y-5">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
