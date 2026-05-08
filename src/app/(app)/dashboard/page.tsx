import Link from "next/link";
import {
  ChartColumn,
  ChevronRight,
  CirclePlay,
  Clapperboard,
  Coins,
  ImageIcon,
  MessageSquareText,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { listQuickGenerations } from "@/lib/ai/quick-generations";
import { requireUserProfile } from "@/lib/auth/server";
import { getFeaturePricing } from "@/lib/pricing/server";
import { buildFeatureCostMap, formatCreditRangeEstimate } from "@/lib/pricing/ui";
import { getProjects } from "@/lib/projects/server";
import { getWalletTransactions, getUserWallet } from "@/lib/wallet/server";

const workflowModes = [
  { label: "Tạo ảnh", href: "/quick-create/image" },
  { label: "Tạo video", href: "/quick-create/video" },
  { label: "Start/End Image to Video", href: "/quick-create/video" },
  { label: "Tạo prompt", href: "/quick-create/prompt" },
  { label: "Viết kịch bản", href: "/quick-ai?mode=script" },
];

const quickCards = [
  {
    title: "Tạo Prompt",
    description: "Biến ý tưởng thô thành prompt có cấu trúc rõ ràng.",
    href: "/quick-create/prompt",
    icon: Sparkles,
    colorClass: "bg-[#0e2a5a] text-[#60a5fa]",
  },
  {
    title: "Kịch bản AI",
    description: "Tạo hook, scene và voice-over cho video quảng cáo.",
    href: "/quick-ai?mode=script",
    icon: MessageSquareText,
    colorClass: "bg-[#1a1050] text-[#a78bfa]",
  },
  {
    title: "Tạo Ảnh",
    description: "Text to Image và Image to Image cho social creative.",
    href: "/quick-create/image",
    icon: ImageIcon,
    colorClass: "bg-[#0a2a2a] text-[#2dd4bf]",
  },
  {
    title: "Tạo Video",
    description: "Veo workflow cho clip ngắn, product shot và transition.",
    href: "/quick-create/video",
    icon: Clapperboard,
    colorClass: "bg-[#2a1a05] text-[#fbbf24]",
  },
];

export default async function DashboardPage() {
  const user = await requireUserProfile();
  const [wallet, projects, outputs, transactions, featurePricing] = await Promise.all([
    getUserWallet(user.id),
    getProjects(user.id),
    listQuickGenerations({ userId: user.id, limit: 12 }),
    getWalletTransactions(user.id, 20),
    getFeaturePricing(),
  ]);
  const featureCosts = buildFeatureCostMap(featurePricing);
  const workflowEstimate = formatCreditRangeEstimate(
    Math.min(featureCosts.image_generation, featureCosts.video_generation),
    Math.max(featureCosts.image_generation, featureCosts.video_generation),
  );

  const imageCount = outputs.filter((item) => item.type === "image").length;
  const videoCount = outputs.filter((item) => item.type === "video").length;
  const promptCount = outputs.filter((item) => item.type === "prompt").length;
  const creditsUsed = transactions
    .filter((item) => item.amountCredit < 0)
    .reduce((total, item) => total + Math.abs(item.amountCredit), 0);
  const recentProjects = projects.slice(0, 3);
  const recentOutputs = outputs.slice(0, 8);
  const activity = [
    ...outputs.slice(0, 5).map((item) => ({
      id: item.id,
      title: formatGenerationTitle(item.type),
      subtitle: `${item.model} · ${item.aspect_ratio ?? "auto"} · ${
        item.duration_seconds ? `${item.duration_seconds}s` : "single pass"
      }`,
      status: item.status,
      time: new Date(item.created_at).toLocaleString("vi-VN"),
    })),
    ...transactions.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.amountCredit > 0 ? "Nạp credits" : "Sử dụng credits",
      subtitle: `${item.transactionType} · ${Math.abs(item.amountCredit)} credits · ví`,
      status: item.amountCredit > 0 ? "completed" : "processing",
      time: new Date(item.createdAt).toLocaleString("vi-VN"),
    })),
  ].slice(0, 8);

  const stats = [
    {
      label: "Video đã tạo",
      value: videoCount.toString(),
      delta: "+12% tuần này",
      icon: Clapperboard,
      deltaClass: "text-[var(--success)]",
    },
    {
      label: "Ảnh đã tạo",
      value: imageCount.toString(),
      delta: "+8% tuần này",
      icon: ImageIcon,
      deltaClass: "text-[var(--success)]",
    },
    {
      label: "Prompt đã tạo",
      value: promptCount.toString(),
      delta: "+21% tuần này",
      icon: Sparkles,
      deltaClass: "text-[var(--success)]",
    },
    {
      label: "Credits đã dùng",
      value: creditsUsed.toString(),
      delta: `${wallet.balanceCredit} còn lại`,
      icon: Coins,
      deltaClass: "text-[var(--pending)]",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI creative home"
        title="Dashboard studio"
        description="Màn hình điều phối cho prompt, image, video, credits và các dự án đang chạy trong cùng một workspace."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {stats.map((item) => (
          <SurfaceCard key={item.label} className="p-[14px]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                {item.label}
              </p>
              <item.icon className="h-4 w-4 text-[var(--highlight)]" />
            </div>
            <p className="mt-4 text-[22px] font-medium text-[var(--foreground)]">{item.value}</p>
            <p className={`mt-2 text-[10px] ${item.deltaClass}`}>{item.delta}</p>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard className="rounded-[var(--radius-shell)] p-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Workflow chính
              </p>
              <h2 className="mt-2 text-2xl font-medium text-[var(--heading)]">
                Bạn muốn tạo gì hôm nay?
              </h2>
            </div>

            <textarea
              readOnly
              placeholder="Nhập ý tưởng video, ảnh, sản phẩm hoặc chiến dịch của bạn..."
              className="min-h-36 w-full rounded-[12px] border bg-[var(--surface-muted)] px-4 py-4 text-sm text-[var(--muted-foreground)]"
            />

            <div className="grid gap-3 md:grid-cols-5">
              {workflowModes.map((mode) => (
                <Link
                  key={mode.label}
                  href={mode.href}
                  className="rounded-[12px] border bg-[var(--surface-muted)] px-3 py-4 text-center text-xs text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:bg-[#111c35] hover:text-[var(--heading)]"
                >
                  {mode.label}
                </Link>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <DashboardSelect
                label="Chọn model"
                value="Gemini 3.1 Flash Image"
              />
              <DashboardSelect
                label="Chọn tỷ lệ"
                value="9:16 · 1:1 · 16:9 · 4:3 · 3:4"
              />
              <DashboardSelect
                label="Upload tham chiếu"
                value="Ảnh, packshot, frame đầu"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Ước tính: <span className="text-[var(--heading)]">{workflowEstimate}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/quick-ai"
                  className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <WandSparkles className="h-4 w-4 text-[var(--highlight)]" />
                  Tối ưu prompt bằng AI
                </Link>
                <Link
                  href="/quick-create/video"
                  className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
                >
                  Tạo ngay
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[12px] border bg-[var(--surface-muted)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                  Trạng thái workspace
                </p>
                <h3 className="mt-2 text-lg font-medium text-[var(--heading)]">
                  Studio đang sẵn sàng tạo nội dung
                </h3>
              </div>
              <span className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--highlight)]">
                Live
              </span>
            </div>

            {[
              `${projects.length} dự án đang hoạt động trong workspace`,
              `${wallet.balanceCredit} credits còn lại cho các job tạo ảnh và video`,
              `${videoCount} video gần đây và ${imageCount} ảnh đã được ghi lịch sử`,
              "Đa provider: OpenAI, Google và 9Router đang được map theo tác vụ",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-4">
        {quickCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <SurfaceCard className="h-full hover:border-[var(--border-strong)] hover:bg-[#111c35]">
              <div className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${card.colorClass}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-[12px] font-medium text-[var(--heading)]">{card.title}</h3>
              <p className="mt-2 text-[10px] leading-5 text-[var(--muted-foreground)]">
                {card.description}
              </p>
            </SurfaceCard>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Output gần đây</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Xem nhanh ảnh, video, prompt và kịch bản vừa tạo.
              </p>
            </div>
            <Link href="/quick-create/history" className="text-sm text-[var(--highlight)]">
              Mở lịch sử
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recentOutputs.length > 0 ? (
              recentOutputs.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[12px] border bg-[var(--surface-muted)]"
                >
                  <div className="flex aspect-[4/3] items-center justify-center border-b bg-[#101a2f] text-[var(--muted)]">
                    {item.type === "video" ? (
                      <CirclePlay className="h-8 w-8 text-[var(--highlight)]" />
                    ) : item.type === "image" ? (
                      <ImageIcon className="h-8 w-8 text-[var(--highlight)]" />
                    ) : (
                      <Sparkles className="h-8 w-8 text-[var(--highlight)]" />
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                        {formatGenerationTitle(item.type)}
                      </span>
                      <span className={getStatusClass(item.status)}>{formatStatus(item.status)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-[var(--muted-foreground)]">
                      {item.model}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full rounded-[12px] border border-dashed px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                Chưa có output nào để hiển thị.
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Dự án gần đây</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Các workspace đang sản xuất hoặc cần mở lại.
              </p>
            </div>
            <Link href="/projects" className="text-sm text-[var(--highlight)]">
              Xem tất cả
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-[12px] border bg-[var(--surface-muted)] p-3 hover:border-[var(--border-strong)]"
                >
                  <div className="relative flex h-20 items-center justify-center rounded-[8px] border bg-[#111b31]">
                    <CirclePlay className="h-7 w-7 text-[var(--highlight)]" />
                    <span className="absolute bottom-2 right-2 rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {project.duration}s
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] font-medium text-[var(--heading)]">{project.title}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                      {project.platform}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      {new Date(project.updatedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="md:col-span-3 rounded-[12px] border border-dashed px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
                Chưa có dự án nào.
              </div>
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="scroll-mt-24" id="analytics">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[var(--heading)]">Hoạt động gần đây</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Theo dõi model, trạng thái và thời điểm xử lý mới nhất.
            </p>
          </div>
          <ChartColumn className="h-5 w-5 text-[var(--highlight)]" />
        </div>

        <div className="mt-5 space-y-3">
          {activity.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full ${getActivityDotClass(item.status)}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--heading)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <span className={getStatusClass(item.status)}>{formatStatus(item.status)}</span>
                <span className="text-xs text-[var(--muted)]">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function DashboardSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function formatGenerationTitle(type: "image" | "video" | "prompt") {
  if (type === "image") return "Ảnh";
  if (type === "video") return "Video";
  return "Prompt";
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    queued: "Chờ hàng",
    processing: "Đang xử lý",
    completed: "Hoàn thành",
    failed: "Lỗi",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const base =
    "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]";

  if (status === "completed") {
    return `${base} border-[rgba(34,197,94,0.35)] text-[var(--success)]`;
  }

  if (status === "processing") {
    return `${base} border-[rgba(59,130,246,0.35)] text-[var(--processing)]`;
  }

  if (status === "queued") {
    return `${base} border-[rgba(245,158,11,0.35)] text-[var(--pending)]`;
  }

  return `${base} border-[rgba(248,113,113,0.35)] text-[var(--danger)]`;
}

function getActivityDotClass(status: string) {
  if (status === "completed") return "bg-[var(--success)]";
  if (status === "processing") return "bg-[var(--processing)]";
  if (status === "queued") return "bg-[var(--pending)]";
  return "bg-[var(--danger)]";
}
