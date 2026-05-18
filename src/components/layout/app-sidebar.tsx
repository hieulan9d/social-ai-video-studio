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
          "fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r bg-[color:color-mix(in_srgb,var(--surface)_90%,var(--surface-tint)_10%)] lg:sticky lg:top-0 lg:flex",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="flex min-w-0 items-center gap-3" onClick={onClose}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-[rgba(96,165,250,0.32)] bg-[color:color-mix(in_srgb,var(--accent)_74%,var(--highlight-teal)_26%)] text-[var(--accent-foreground)]">
                <Clapperboard className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--heading)]">
                  Social AI Video Studio
                </p>
                <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                  AI creative studio
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
                      "flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 text-left transition-colors",
                      hasActiveItem
                        ? "bg-[color:color-mix(in_srgb,var(--accent-soft)_60%,var(--highlight-violet)_20%)] text-[var(--heading)]"
                        : "text-[var(--muted-foreground)] hover:bg-[color:color-mix(in_srgb,var(--surface-muted)_88%,var(--accent-soft)_12%)] hover:text-[var(--foreground)]",
                    ].join(" ")}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
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

          <div className="mt-6 rounded-[12px] border bg-[color:color-mix(in_srgb,var(--surface-muted)_82%,var(--accent-soft)_18%)] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(96,165,250,0.28)] bg-[color:color-mix(in_srgb,var(--accent-soft)_72%,var(--highlight-teal)_28%)] text-xs font-medium text-[var(--heading)]">
                {initials || "AI"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-[var(--heading)]">
                  {userLabel}
                </p>
                <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                  Gói workspace
                </p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((current) => !current)}
                  className="rounded-[8px] border border-[var(--border)] p-2 text-[var(--muted-foreground)]"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {menuOpen ? (
                  <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-44 overflow-hidden rounded-[12px] border border-[rgba(96,165,250,0.16)] bg-[color:color-mix(in_srgb,var(--surface)_90%,var(--surface-tint)_10%)] p-1.5">
                    {secondaryNavigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          setMenuOpen(false);
                          onClose?.();
                        }}
                        className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[12px] text-[var(--muted-foreground)] hover:bg-[color:color-mix(in_srgb,var(--surface-muted)_88%,var(--accent-soft)_12%)] hover:text-[var(--foreground)]"
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
    "flex items-center gap-3 rounded-[8px] border px-3 py-2.5",
    isActive
      ? "border-[rgba(96,165,250,0.24)] bg-[color:color-mix(in_srgb,var(--accent)_76%,var(--highlight-teal)_24%)] text-[var(--heading)]"
      : "border-transparent text-[var(--muted-foreground)] hover:border-[rgba(96,165,250,0.14)] hover:bg-[color:color-mix(in_srgb,var(--surface-muted)_88%,var(--accent-soft)_12%)] hover:text-[var(--foreground)]",
  ].join(" ");
}
