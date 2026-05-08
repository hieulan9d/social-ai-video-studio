import {
  ChartColumn,
  Coins,
  FileText,
  FolderKanban,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  Library,
  MessageSquareText,
  Rocket,
  Settings2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Video,
} from "lucide-react";

export type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

export type NavSection = {
  label: string;
  items: NavLink[];
};

export const navigationSections: NavSection[] = [
  {
    label: "Tổng quan",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/quick-ai", label: "Tạo nhanh AI", icon: Rocket, badge: "Mới" },
    ],
  },
  {
    label: "Sản xuất",
    items: [
      { href: "/projects", label: "Dự án", icon: FolderKanban },
      { href: "/quick-create/video", label: "Tạo video", icon: Video },
      { href: "/quick-create/image", label: "Tạo ảnh", icon: ImageIcon },
      { href: "/quick-create/prompt", label: "Prompt AI", icon: Sparkles, badge: "Mới" },
      { href: "/quick-ai?mode=script", label: "Kịch bản AI", icon: MessageSquareText },
      { href: "/projects?tab=assets", label: "Thư viện Assets", icon: Library },
      { href: "/quick-create/history", label: "Lịch sử tạo", icon: FileText },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { href: "/analytics", label: "Analytics", icon: ChartColumn },
      { href: "/wallet", label: "Credits", icon: Coins },
      { href: "/settings", label: "Cài đặt AI", icon: Settings2 },
      { href: "/admin", label: "Admin", icon: ShieldCheck },
    ],
  },
];

export const appNavigation: NavLink[] = navigationSections.flatMap((section) => section.items);

export const secondaryNavigation: NavLink[] = [
  { href: "/pricing", label: "Bảng giá", icon: Coins },
  { href: "/terms", label: "Điều khoản", icon: FileText },
  { href: "/auth", label: "Tài khoản", icon: HelpCircle },
];

export const quickStudioNavigation: NavLink[] = [
  { href: "/quick-ai", label: "Tạo nhanh AI", icon: WandSparkles },
  { href: "/quick-create/prompt", label: "Prompt AI", icon: Sparkles },
  { href: "/quick-create/image", label: "Tạo ảnh", icon: ImageIcon },
  { href: "/quick-create/video", label: "Tạo video", icon: Video },
];
