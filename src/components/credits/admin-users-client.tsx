"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";

type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  plan: "free" | "pro" | "business";
  balance: number;
  total_added: number;
  total_used: number;
  created_at: string;
};

export function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async (query = search) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Không tải được danh sách người dùng.");
      }

      setUsers(payload.items);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không tải được danh sách người dùng.",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  async function postAction(url: string, body: Record<string, unknown>) {
    setMessage(null);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? "Cập nhật thất bại.");
    }

    setMessage("Cập nhật thành công.");
    await loadUsers();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Quản lý người dùng"
        description="Xem user, số dư credit, role, plan và thao tác cộng hoặc điều chỉnh credit."
      />

      <SurfaceCard>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void loadUsers(search);
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo email hoặc tên..."
            className="min-h-11 flex-1 rounded-[12px] border bg-[var(--surface-muted)] px-4 text-sm text-[var(--foreground)]"
          />
          <button className="rounded-[8px] bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-foreground)]">
            Tìm kiếm
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-[var(--highlight)]">{message}</p> : null}
      </SurfaceCard>

      <SurfaceCard>
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Đang tải người dùng...</p>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Họ tên</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Credit</th>
                  <th className="px-3 py-3">Ngày tạo</th>
                  <th className="px-3 py-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border)] align-top">
                    <td className="px-3 py-3 text-[var(--heading)]">{user.email}</td>
                    <td className="px-3 py-3 text-[var(--muted-foreground)]">
                      {user.full_name ?? "-"}
                    </td>
                    <td className="px-3 py-3">{user.role}</td>
                    <td className="px-3 py-3">{user.plan}</td>
                    <td className="px-3 py-3 text-[#fbbf24]">{user.balance}</td>
                    <td className="px-3 py-3 text-[var(--muted-foreground)]">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="space-y-2 px-3 py-3">
                      <AdminUserActions user={user} postAction={postAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">Không có người dùng.</p>
        )}
      </SurfaceCard>
    </div>
  );
}

function AdminUserActions({
  user,
  postAction,
}: {
  user: AdminUserRow;
  postAction: (url: string, body: Record<string, unknown>) => Promise<void>;
}) {
  const [amount, setAmount] = useState("100");
  const [newBalance, setNewBalance] = useState(String(user.balance));
  const [role, setRole] = useState(user.role);
  const [plan, setPlan] = useState(user.plan);

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-24 rounded-[8px] border bg-[var(--surface-muted)] px-2 py-1 text-xs"
        />
        <button
          onClick={() =>
            void postAction("/api/admin/credits/add", {
              userId: user.id,
              amount: Number(amount),
              reason: "Admin cộng credit",
            })
          }
          className="rounded-[8px] border px-2 py-1 text-xs"
        >
          Cộng credit
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={newBalance}
          onChange={(event) => setNewBalance(event.target.value)}
          className="w-24 rounded-[8px] border bg-[var(--surface-muted)] px-2 py-1 text-xs"
        />
        <button
          onClick={() =>
            void postAction("/api/admin/credits/adjust", {
              userId: user.id,
              newBalance: Number(newBalance),
              reason: "Admin điều chỉnh credit",
            })
          }
          className="rounded-[8px] border px-2 py-1 text-xs"
        >
          Chỉnh credit
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as AdminUserRow["role"])}
          className="rounded-[8px] border bg-[var(--surface-muted)] px-2 py-1 text-xs"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button
          onClick={() =>
            void postAction(`/api/admin/users/${user.id}/role`, {
              role,
            })
          }
          className="rounded-[8px] border px-2 py-1 text-xs"
        >
          Đổi role
        </button>
      </div>
      <div className="flex gap-2">
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value as AdminUserRow["plan"])}
          className="rounded-[8px] border bg-[var(--surface-muted)] px-2 py-1 text-xs"
        >
          <option value="free">free</option>
          <option value="pro">pro</option>
          <option value="business">business</option>
        </select>
        <button
          onClick={() =>
            void postAction(`/api/admin/users/${user.id}/plan`, {
              plan,
            })
          }
          className="rounded-[8px] border px-2 py-1 text-xs"
        >
          Đổi plan
        </button>
      </div>
    </div>
  );
}
