"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Clapperboard, MoreHorizontal, X } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useAuth } from "@/hooks/use-auth";
import { navigationSections, secondaryNavigation } from "@/lib/navigation";

export function AppSidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const user = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const userLabel = user.fullName || user.workspaceName || "Người dùng";
  const initials = userLabel
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  // Determine which section is active based on current path
  const activeSectionIndex = navigationSections.findIndex((section) =>
    section.items.some((item) => {
      const normalizedHref = item.href.split("?")[0];
      return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
    })
  );

  const [openSection, setOpenSection] = useState<number>(activeSectionIndex >= 0 ? activeSectionIndex : 0);

  const handleSectionClick = (index: number) => {
    setOpenSection(openSection === index ? -1 : index);
  };

  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-30 bg-black/50 lg:hidden",
          mobileOpen ? "block" : "hidden",
        ].join(" ")}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-white/[0.06] bg-[#0c0c0f]/80 backdrop-blur-xl lg:sticky lg:top-0 lg:flex",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={onClose}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                <Clapperboard className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  AI Video Studio
                </p>
                <p className="truncate text-[10px] text-zinc-500">
                  Creative platform
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-[var(--border)] p-2 text-[var(--muted-foreground)] lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 flex-1 space-y-2 overflow-y-auto">
            {navigationSections.map((section, sectionIndex) => {
              const isOpen = openSection === sectionIndex;
              const hasActiveItem = section.items.some((item) => {
                const normalizedHref = item.href.split("?")[0];
                return pathname === normalizedHref || pathname.startsWith(`${normalizedHref}/`);
              });

              return (
                <div key={section.label}>
                  <button
                    type="button"
                    onClick={() => handleSectionClick(sectionIndex)}
                    className={[
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all",
                      hasActiveItem
                        ? "bg-indigo-500/10 text-white"
                        : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300",
                    ].join(" ")}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-widest">
                      {section.label}
                    </span>
                    <ChevronDown
                      className={[
                        "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                        isOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-1.5 space-y-1 pl-1">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={true}
                          onClick={onClose}
                          className={getNavClass(pathname, item.href)}
                        >
                          <item.icon className="h-[15px] w-[15px] shrink-0" />
                          <span className="truncate text-[12px]">{item.label}</span>
                          {item.badge ? (
                            <span className="ml-auto rounded-full border border-[rgba(96,165,250,0.28)] bg-[color:color-mix(in_srgb,var(--accent-soft)_76%,var(--highlight-violet)_24%)] px-2 py-0.5 text-[10px] text-[var(--heading)]">
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-xs font-medium text-indigo-300">
                {initials || "AI"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white">
                  {userLabel}
                </p>
                <p className="truncate text-[10px] text-zinc-500">
                  Workspace
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="rounded-lg border border-white/[0.06] p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {menuOpen ? (
                  <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-44 overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/95 backdrop-blur-xl p-1.5 shadow-xl">
                    {secondaryNavigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setMenuOpen(false);
                          onClose?.();
                        }}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                      >
                        <item.icon className="h-[14px] w-[14px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function getNavClass(pathname: string, href: string) {
  const normalizedHref = href.split("?")[0];
  const isActive =
    pathname === normalizedHref ||
    (normalizedHref !== "/dashboard" && pathname.startsWith(`${normalizedHref}/`));

  return [
    "flex items-center gap-3 rounded-lg border px-3 py-2",
    isActive
      ? "border-indigo-500/20 bg-indigo-500/10 text-white shadow-sm shadow-indigo-500/5"
      : "border-transparent text-zinc-400 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-200",
  ].join(" ");
}
