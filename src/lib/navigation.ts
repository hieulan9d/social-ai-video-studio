import {
  CreditCard,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Settings,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const appNavigation: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/wallet", label: "Wallet", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const secondaryNavigation: NavLink[] = [
  { href: "/auth", label: "Account", icon: HelpCircle },
];
