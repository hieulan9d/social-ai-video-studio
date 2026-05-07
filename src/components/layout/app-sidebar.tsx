"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useAuth } from "@/hooks/use-auth";
import { appNavigation, secondaryNavigation } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuth();
  const userLabel = user.fullName || user.workspaceName || "Người dùng workspace";

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-5 py-6 lg:block">
      <Link href="/" className="flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
          <Clapperboard className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Social AI Video Studio</p>
          <p className="text-xs text-[var(--muted-foreground)]">Nền tảng MVP</p>
        </div>
      </Link>

      <div className="mt-8 space-y-2">
        {appNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={getNavClass(pathname, item.href)}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 border-t border-[var(--border)] pt-6">
        <p className="px-2 text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
          Hỗ trợ
        </p>
        <div className="mt-3 space-y-2">
          {secondaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={getNavClass(pathname, item.href)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-[28px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <p className="text-sm font-semibold">{userLabel}</p>
        <p className="mt-1 break-all text-xs text-[var(--muted-foreground)]">
          {user.email}
        </p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}

function getNavClass(pathname: string, href: string) {
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return [
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
    isActive
      ? "bg-[var(--foreground)] text-[var(--background)]"
      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]",
  ].join(" ");
}
