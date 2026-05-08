import Link from "next/link";

const links = [
  { href: "/quick-create/prompt", label: "Tạo Prompt AI", active: "prompt" },
  { href: "/quick-create/image", label: "Tạo ảnh nhanh", active: "image" },
  { href: "/quick-create/video", label: "Tạo video nhanh", active: "video" },
  { href: "/quick-create/history", label: "History", active: "history" },
] as const;

export function QuickStudioNav({
  active,
}: {
  active: "prompt" | "image" | "video" | "history";
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const isActive = link.active === active;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "rounded-2xl border px-4 py-2 text-sm font-medium transition",
              isActive
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
