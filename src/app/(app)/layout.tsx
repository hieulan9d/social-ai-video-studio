import { AppShell } from "@/components/layout/app-shell";
import { requireUserProfile } from "@/lib/auth/server";
import { getUserWallet } from "@/lib/wallet/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Parallel fetch — don't await sequentially
  const userPromise = requireUserProfile();
  const user = await userPromise;
  const wallet = await getUserWallet(user.id);

  return (
    <AppShell user={user} credits={wallet.balanceCredit}>
      {children}
    </AppShell>
  );
}
