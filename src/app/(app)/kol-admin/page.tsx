import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUserProfile } from "@/lib/auth/server";
import { WorkspaceService, KolService, CampaignService, formatError } from "@/modules/ai-kol-system";
import type { KolMaster, Campaign } from "@/modules/ai-kol-system";
import { Users, Video, FolderKanban, Sparkles, ImageIcon, ArrowRight } from "lucide-react";

export default async function KolAdminDashboard() {
  const user = await requireUserProfile();
  const supabase = await createClient();

  let kols: KolMaster[] = [];
  let campaigns: Campaign[] = [];
  let workspaceCount = 0;

  try {
    const wsService = new WorkspaceService(supabase);
    const kolService = new KolService(supabase);
    const campaignService = new CampaignService(supabase);

    const workspaces = await wsService.getUserWorkspaces(user.id);
    workspaceCount = workspaces.length;

    const kolArrays = await Promise.all(
      workspaces.map((ws) => kolService.getWorkspaceKols(ws.id))
    );
    kols = kolArrays.flat();

    const campaignArrays = await Promise.all(
      kols.map((k) => campaignService.getKolCampaigns(k.id))
    );
    campaigns = campaignArrays.flat();
  } catch { /* ignore */ }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            AI KOL Studio
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-lg">
            Hệ thống sản xuất video AI KOL — tạo nhân vật, quản lý chiến dịch, 
            generate kịch bản và render video tự động.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="h-5 w-5" />}
          value={workspaceCount}
          label="Workspaces"
          color="blue"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          value={kols.length}
          label="KOLs"
          color="purple"
        />
        <StatCard
          icon={<Video className="h-5 w-5" />}
          value={campaigns.length}
          label="Campaigns"
          color="green"
        />
        <StatCard
          icon={<ImageIcon className="h-5 w-5" />}
          value={campaigns.filter((c) => c.status === "planning" || c.status === "in_production").length}
          label="Đang sản xuất"
          color="orange"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        <QuickAction
          href="/kol-admin/kols/new"
          icon={<Sparkles className="h-6 w-6" />}
          title="Tạo KOL mới"
          description="Khởi tạo nhân vật AI KOL với avatar và giọng nói"
          gradient="from-purple-600/20 to-pink-600/10"
        />
        <QuickAction
          href="/kol-admin/campaigns"
          icon={<Video className="h-6 w-6" />}
          title="Chiến dịch"
          description="Quản lý campaigns, tạo kịch bản và render video"
          gradient="from-blue-600/20 to-cyan-600/10"
        />
        <QuickAction
          href="/kol-admin/styles"
          icon={<ImageIcon className="h-6 w-6" />}
          title="Phong cách ảnh"
          description="Tạo ảnh theo template phong cách có sẵn"
          gradient="from-green-600/20 to-emerald-600/10"
        />
      </div>

      {/* Recent KOLs */}
      {kols.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">KOLs gần đây</h2>
            <Link href="/kol-admin/kols" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kols.slice(0, 4).map((k) => (
              <Link
                key={k.id}
                href={`/kol-admin/kols/${k.id}/avatar`}
                className="group border border-white/10 rounded-xl p-4 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  {k.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={k.avatarUrl} alt={k.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-purple-500/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xs font-medium">
                      {k.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{k.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {k.status === "active" ? "🟢 Active" : "⚪ Draft"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent campaigns */}
      {campaigns.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Campaigns gần đây</h2>
            <Link href="/kol-admin/campaigns" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {campaigns.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/kol-admin/campaigns/${c.id}`}
                className="flex items-center justify-between border border-white/10 rounded-lg p-3 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
              >
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-gray-500">
                    {c.platform && <span className="mr-2">{c.platform}</span>}
                    <span className={
                      c.status === "planning" ? "text-yellow-400" :
                      c.status === "in_production" ? "text-blue-400" :
                      c.status === "completed" ? "text-green-400" :
                      "text-gray-400"
                    }>
                      {c.status}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {kols.length === 0 && (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
            <Users className="h-7 w-7 text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg">Bắt đầu với AI KOL</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Tạo workspace đầu tiên, sau đó tạo KOL với avatar AI để bắt đầu sản xuất video.
          </p>
          <div className="flex gap-3 justify-center mt-5">
            <Link
              href="/kol-admin/workspaces"
              className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/5"
            >
              Tạo Workspace
            </Link>
            <Link
              href="/kol-admin/kols/new"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
            >
              Tạo KOL đầu tiên
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: "blue" | "purple" | "green" | "orange";
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    green: "from-green-500/20 to-green-600/5 border-green-500/20",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/20",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div className="text-gray-400">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div className="text-xs text-gray-400 mt-2">{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all bg-gradient-to-br ${gradient}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
      <div className="relative">
        <div className="text-gray-300 group-hover:text-white transition-colors">{icon}</div>
        <h3 className="font-semibold mt-3">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
