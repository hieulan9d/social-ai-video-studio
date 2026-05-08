import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Clock3, Coins, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { getProjects } from "@/lib/projects/server";
import { getUserWallet } from "@/lib/wallet/server";

export default async function DashboardPage() {
  const user = await requireUserProfile();
  const [wallet, projects] = await Promise.all([
    getUserWallet(user.id),
    getProjects(user.id),
  ]);
  const recentProjects = projects.slice(0, 3);
  const stats = [
    {
      title: "Dự án đang có",
      value: projects.length.toString(),
      note: "Các dự án riêng thuộc workspace này",
      icon: BarChart3,
    },
    {
      title: "Tín dụng còn lại",
      value: wallet.balanceCredit.toString(),
      note: "Số dư ví được đọc trực tiếp từ cơ sở dữ liệu.",
      icon: Coins,
    },
    {
      title: "Render đang theo dõi",
      value: "Live",
      note: "Trạng thái render và export được lưu theo từng dự án",
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tổng quan workspace"
        title="Bảng điều khiển"
        description="Trung tâm theo dõi dự án, tín dụng, render và các thao tác vận hành trước khi ra mắt."
      />

      {!user.onboardingCompletedAt ? (
        <SurfaceCard>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--accent)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Hoàn tất hướng dẫn bắt đầu</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Chọn mục tiêu sử dụng để workspace gợi ý luồng tạo dự án đầu
                  tiên phù hợp hơn.
                </p>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
            >
              Tiếp tục thiết lập
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-3">
        {stats.map((item) => (
          <SurfaceCard key={item.title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">{item.title}</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">{item.value}</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.note}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--surface-elevated)] p-3 text-[var(--accent)]">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {[
          {
            href: "/quick-create/prompt",
            title: "Tạo Prompt AI",
            description:
              "Biến ý tưởng ngắn thành prompt chi tiết cho ảnh hoặc video, có cấu trúc rõ ràng trước khi generate.",
          },
          {
            href: "/quick-create/image",
            title: "Tạo ảnh nhanh",
            description:
              "Dùng prompt đã tối ưu để tạo ảnh AI ngay, xem preview và lưu về dự án khi cần.",
          },
          {
            href: "/quick-create/video",
            title: "Tạo video nhanh",
            description:
              "Tạo video bằng prompt hoặc hình tham chiếu, phù hợp cho flow thử ý tưởng nhanh ngoài project mode.",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <SurfaceCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-5 w-5 text-[var(--accent)]" />
              </div>
            </SurfaceCard>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Dự án gần đây</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Các hoạt động dự án mới nhất trong workspace.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
              Đã đồng bộ
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex flex-col justify-between gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 md:flex-row md:items-center"
                >
                  <div>
                    <p className="text-base font-medium">{project.title}</p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {project.platform} / {project.videoType.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
                    {formatProjectStatus(project.status)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
                <p className="font-medium">Chưa có dự án</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Tạo dự án đầu tiên để bắt đầu quy trình kịch bản, cảnh, prompt,
                  render và export.
                </p>
                <Link
                  href="/projects/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)]"
                >
                  Tạo dự án
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--surface-elevated)] p-3 text-[var(--accent)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Trạng thái hệ thống</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Mức sẵn sàng của pipeline sản xuất video.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              "Auth, ví tín dụng, thanh toán và admin đã sẵn sàng",
              "Tải tài sản và lớp trừu tượng storage đã được nối",
              "Text-to-video, image-to-video và transition đều có tracking job",
              "Export engine tạo bản ghi video cuối có thể tải xuống",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}

function formatProjectStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "Bản nháp",
    brief_ready: "Brief đã sẵn sàng",
    script_ready: "Kịch bản đã sẵn sàng",
    rendering: "Đang render",
    completed: "Đã hoàn tất",
    archived: "Đã lưu trữ",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}
