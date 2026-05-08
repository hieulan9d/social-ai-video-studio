import Link from "next/link";

const links = [
  { href: "/quick-ai", label: "Tạo nhanh AI", active: "quick-ai" },
  { href: "/quick-create/prompt", label: "Prompt AI", active: "prompt" },
  { href: "/quick-create/image", label: "Tạo ảnh", active: "image" },
  { href: "/quick-create/video", label: "Tạo video", active: "video" },
  { href: "/quick-create/history", label: "Lịch sử", active: "history" },
] as const;

export function QuickStudioNav({
  active,
}: {
  active: "quick-ai" | "prompt" | "image" | "video" | "history";
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
              "rounded-[8px] border px-4 py-2.5 text-sm",
              isActive
                ? "border-[#29508d] bg-[#1a3a7a] text-[var(--heading)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
