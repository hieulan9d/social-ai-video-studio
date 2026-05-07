import {
  CreditCard,
  DollarSign,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Rocket,
  ShieldCheck,
  Video,
  Settings,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const appNavigation: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: Rocket },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/render-history", label: "Render history", icon: Video },
  { href: "/wallet", label: "Wallet", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const secondaryNavigation: NavLink[] = [
  { href: "/pricing", label: "Pricing", icon: DollarSign },
  { href: "/terms", label: "Terms", icon: FileText },
  { href: "/auth", label: "Account", icon: HelpCircle },
];
