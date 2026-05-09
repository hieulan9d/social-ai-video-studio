import { requireAdmin } from "@/lib/auth/get-current-user";
import { AdminUsersClient } from "@/components/credits/admin-users-client";

export default async function AdminUsersPage() {
  await requireAdmin();
  return <AdminUsersClient />;
}
