import Link from "next/link";
import { CheckCircle2, FolderPlus, ImageUp, PlaySquare, Sparkles } from "lucide-react";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { PageHeader } from "@/components/ui/page-header";
import { ServerDataFallback } from "@/components/ui/server-data-fallback";
import { SurfaceCard } from "@/components/ui/surface-card";
import { requireUserProfile } from "@/lib/auth/server";
import { rethrowNextServerError } from "@/lib/next-server-errors";
import { completeOnboardingAction } from "@/lib/onboarding/actions";

const checklist = [
  {
    title: "Tạo dự án đầu tiên",
    description: "Lưu nền tảng, thời lượng, phong cách, ngôn ngữ và brief chiến dịch.",
    icon: FolderPlus,
  },
  {
    title: "Tạo kịch bản, cảnh và prompt",
    description: "Dùng tín dụng để tạo đầu ra AI có cấu trúc và gắn trực tiếp với dự án.",
    icon: Sparkles,
  },
  {
    title: "Tải tài sản thương hiệu",
    description: "Thêm ảnh sản phẩm, logo, avatar và ảnh đầu-cuối để giữ nhất quán.",
    icon: ImageUp,
  },
  {
    title: "Render và export",
    description: "Gửi job Veo, xem lại clip, rồi export video cuối có thể tải xuống.",
    icon: PlaySquare,
  },
];

const goals = [
  "Quảng cáo sản phẩm TikTok",
  "Ra mắt beauty và skincare",
  "Promo nhà hàng",
  "Chiến dịch dịch vụ địa phương",
  "Pipeline sản xuất cho agency",
  "Nội dung AI virtual KOL",
];

export default async function OnboardingPage() {
  let user;

  try {
    user = await requireUserProfile();
  } catch (error) {
    rethrowNextServerError(error);
    console.error("Onboarding page load failed:", error);
    return <ServerDataFallback />;
  }

  const isComplete = Boolean(user.onboardingCompletedAt);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Thiết lập ra mắt"
        title="Hướng dẫn bắt đầu"
        description="Luồng thiết lập ngắn để biến workspace trống thành dự án sản xuất video đầu tiên."
      />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[var(--surface-elevated)] p-3 text-[var(--accent)]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isComplete ? "Đã hoàn tất hướng dẫn" : "Hoàn tất thiết lập"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Lưu mục tiêu sử dụng để workspace hướng bạn tới luồng tạo dự án
                đầu tiên phù hợp.
              </p>
            </div>
          </div>

          <form action={completeOnboardingAction} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Vai trò trong workspace</label>
              <select
                name="workspaceRole"
                defaultValue="creator"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none focus:border-[var(--accent)]"
              >
                <option value="creator">Creator</option>
                <option value="brand">Người vận hành thương hiệu</option>
                <option value="agency">Đội agency</option>
                <option value="editor">Video editor</option>
              </select>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">Mục tiêu chính khi ra mắt</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {goals.map((goal) => (
                  <label
                    key={goal}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="goals"
                      value={goal}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    {goal}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <FormSubmitButton
                pendingLabel="Đang lưu thiết lập..."
                className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
              >
                Lưu và tạo dự án
              </FormSubmitButton>
              <Link
                href="/projects/new"
                className="rounded-2xl border border-[var(--border)] px-5 py-3 text-sm font-medium"
              >
                Bỏ qua tới dự án
              </Link>
            </div>
          </form>
        </SurfaceCard>

        <div className="grid gap-4">
          {checklist.map((item, index) => (
            <SurfaceCard key={item.title}>
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                    Bước {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </div>
    </div>
  );
}
