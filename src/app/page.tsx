import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  Coins,
  Film,
  ImageUp,
  Layers3,
  PlaySquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
export const dynamic = "force-dynamic"; // thêm dòng này ở đây


const workflow = [
  "Brief",
  "Kịch bản",
  "Cảnh",
  "Prompt",
  "Veo render",
  "Export",
];

const capabilities = [
  {
    title: "Sản xuất AI có cấu trúc",
    description:
      "Tạo kịch bản quảng cáo tiếng Việt, tách cảnh và prompt tiếng Anh sẵn sàng cho Veo, tất cả gắn với từng dự án.",
    icon: Sparkles,
  },
  {
    title: "Render theo tài sản thương hiệu",
    description:
      "Tải ảnh sản phẩm, logo, avatar, ảnh nền, ảnh bắt đầu và ảnh kết thúc để giữ video nhất quán.",
    icon: ImageUp,
  },
  {
    title: "Workflow dùng tín dụng",
    description:
      "Số dư ví, giá tính năng, trừ tín dụng, hoàn tín dụng và thanh toán đều được lưu trong cơ sở dữ liệu để dễ kiểm toán.",
    icon: Coins,
  },
  {
    title: "Output sẵn sàng export",
    description:
      "Ghép clip, thêm phụ đề, nhạc, voiceover, watermark/logo và export video 9:16, 1:1 hoặc 16:9.",
    icon: Film,
  },
];

const trust = [
  "API key chỉ chạy ở backend",
  "Dự án và tài sản được phân quyền theo người dùng",
  "Có luồng hoàn tín dụng khi render thất bại",
  "Có dashboard vận hành cho admin",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="px-6 py-6 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-14">
          <header className="flex items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-soft)]">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                <Clapperboard className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">Social AI Video Studio</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-[var(--muted-foreground)] md:flex">
              <a href="#workflow">Workflow</a>
              <a href="#features">Tính năng</a>
              <Link href="/pricing">Bảng giá</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/auth"
                className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
              >
                Đăng nhập
              </Link>
              <Link
                href="/onboarding"
                className="hidden rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)] sm:inline-flex"
              >
                Bắt đầu
              </Link>
            </div>
          </header>

          <div className="grid min-h-[calc(100vh-9rem)] gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
                <PlaySquare className="h-4 w-4 text-[var(--accent)]" />
                Sản xuất video ngắn bằng AI cho đội ngũ ra mắt sản phẩm
              </div>

              <div>
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
                  Social AI Video Studio
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted-foreground)]">
                  Biến brief sản phẩm thành kịch bản, kế hoạch cảnh, prompt Veo,
                  job render và video social có thể tải xuống trong một workspace
                  sản xuất dùng tín dụng.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-6 py-4 text-sm font-medium text-[var(--background)]"
                >
                  Tạo dự án đầu tiên
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm font-medium"
                >
                  Xem bảng giá
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {trust.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
                <Image
                  src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80"
                  alt="Workspace sản xuất video social"
                  width={1200}
                  height={700}
                  priority
                  className="h-72 w-full object-cover sm:h-96"
                />
                <div className="grid gap-4 p-5 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Chiến dịch đang chạy
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">Glow Serum Launch</h2>
                    <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                      Tín dụng và tài sản đã được xác minh
                    </div>
                  </div>

                  <div className="space-y-3">
                    {workflow.slice(0, 4).map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-semibold text-[var(--background)]">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y border-[var(--border)] bg-[var(--surface)] px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                Workflow sản xuất
              </p>
              <h2 className="mt-3 text-3xl font-semibold">Từ ý tưởng tới bản export cuối</h2>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
            >
              Tạo dự án
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-6">
            {workflow.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
              >
                <p className="text-xs text-[var(--muted-foreground)]">0{index + 1}</p>
                <p className="mt-2 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-elevated)] text-[var(--accent)]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] px-6 py-8 text-sm text-[var(--muted-foreground)] lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4" />
            Social AI Video Studio
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy">Quyền riêng tư</Link>
            <Link href="/terms">Điều khoản</Link>
            <Link href="/refund-policy">Chính sách hoàn tín dụng</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
