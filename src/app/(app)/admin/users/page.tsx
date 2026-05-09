import { requireAdmin } from "@/lib/auth/get-current-user";
import { AdminUsersClient } from "@/components/credits/admin-users-client";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { rethrowNextServerError } from "@/lib/next-server-errors";

export default async function AdminUsersPage() {
  try {
    await requireAdmin();
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Admin users page load failed:", error);
    return <ServerDataFallback />;
  }

  return <AdminUsersClient />;
}
