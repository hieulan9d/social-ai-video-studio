import Link from "next/link";

export default function KolAdminDashboard() {
  const cards = [
    {
      href: "/kol-admin/kols",
      title: "KOLs",
      description: "Quản lý AI KOL identities",
    },
    {
      href: "/kol-admin/kols/new",
      title: "Tạo KOL mới",
      description: "Khởi tạo một AI KOL mới",
    },
    {
      href: "/kol-admin/workspaces",
      title: "Workspaces",
      description: "Quản lý workspace",
    },
    {
      href: "/kol-admin/campaigns",
      title: "Campaigns",
      description: "Quản lý chiến dịch",
    },
    {
      href: "/kol-admin/system-test",
      title: "System Test",
      description: "Kiểm tra database & Supabase",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI KOL System Admin</h1>
        <p className="text-sm text-gray-500">Temporary admin UI for the AI KOL platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
          >
            <h3 className="font-semibold">{card.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
