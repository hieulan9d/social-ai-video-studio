import {
  CreditCard,
  DollarSign,
  FileText,
  FolderKanban,
  HelpCircle,
  Images,
  LayoutDashboard,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const appNavigation: NavLink[] = [
  { href: "/dashboard", label: "Bảng điều khiển", icon: LayoutDashboard },
  { href: "/onboarding", label: "Hướng dẫn bắt đầu", icon: Rocket },
  { href: "/quick-create/prompt", label: "Tạo Prompt AI", icon: Sparkles },
  { href: "/quick-create/image", label: "Tạo ảnh nhanh", icon: Images },
  { href: "/quick-create/video", label: "Tạo video nhanh", icon: Video },
  { href: "/projects", label: "Dự án", icon: FolderKanban },
  { href: "/render-history", label: "Lịch sử render", icon: Video },
  { href: "/wallet", label: "Ví tín dụng", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export const secondaryNavigation: NavLink[] = [
  { href: "/pricing", label: "Bảng giá", icon: DollarSign },
  { href: "/terms", label: "Điều khoản", icon: FileText },
  { href: "/auth", label: "Tài khoản", icon: HelpCircle },
];
