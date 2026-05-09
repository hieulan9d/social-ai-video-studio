import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { getCurrentUserProfile } from "@/lib/auth/server";
import { getUserCredits } from "@/lib/credits/credit-service";
import { rethrowNextServerError } from "@/lib/next-server-errors";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user;
  try {
    user = await getCurrentUserProfile();
  } catch (error) {
    rethrowNextServerError(error);
    console.error("App layout profile load failed:", error);
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 text-[var(--foreground)]">
        <ServerDataFallback />
      </div>
    );
  }

  if (!user || user.accountStatus === "suspended") {
    redirect("/auth");
  }

  let credits = 0;
  try {
    const userCredits = await getUserCredits(user.id);
    credits = userCredits.balance;
  } catch (error) {
    rethrowNextServerError(error);
    console.error("App layout user_credits load failed:", error);
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 text-[var(--foreground)]">
        <ServerDataFallback />
      </div>
    );
  }

  return (
    <AppShell user={user} credits={credits}>
      {children}
    </AppShell>
  );
}
