"use client";

import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { appNavigation } from "@/lib/navigation";

export function AppTopbar() {
  const user = useAuth();
  const userLabel = user.fullName || user.workspaceName || user.email;

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">
              Search projects, scripts, renders...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--muted-foreground)]">
              <Bell className="h-4 w-4" />
            </button>
            <div className="hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-right md:block">
              <p className="max-w-44 truncate text-sm font-medium">{userLabel}</p>
              <p className="max-w-44 truncate text-xs text-[var(--muted-foreground)]">
                {user.email}
              </p>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
            >
              <Plus className="h-4 w-4" />
              New project
            </Link>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {appNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
