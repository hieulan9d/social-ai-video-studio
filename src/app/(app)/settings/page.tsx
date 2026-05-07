import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Thiết lập workspace"
        title="Cài đặt"
        description="Cấu hình hồ sơ, mặc định thương hiệu, ưu tiên nền tảng và các tích hợp trong tương lai."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard>
          <h2 className="text-xl font-semibold">Hồ sơ</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SettingField label="Tên workspace" value="Hang Thu Media" />
            <SettingField label="Email chính" value="admin@hangthu.media" />
            <SettingField label="Ngôn ngữ mặc định" value="Tiếng Việt" />
            <SettingField label="Múi giờ" value="Asia/Bangkok" />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Mặc định thương hiệu</h2>
          <div className="mt-6 space-y-4">
            {[
              "Tone CTA chính: gấp rút và trực diện",
              "Phong cách hình ảnh: cao cấp, chân thực, cinematic",
              "Định dạng export mặc định: video social 1080x1920",
              "Preset phụ đề và màu thương hiệu",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
              >
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Tích hợp</h2>
          <div className="mt-6 space-y-3">
            {[
              "Supabase cho cơ sở dữ liệu và auth",
              "OpenAI cho tạo kịch bản và prompt",
              "Google Veo cho job render",
              "Cloud storage và queue worker",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-3"
              >
                <span className="text-sm">{item}</span>
                <span className="rounded-full bg-[var(--surface-elevated)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                  Chưa kết nối
                </span>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Quyền truy cập và vai trò</h2>
          <div className="mt-6 space-y-3">
            {[
              "Owner: toàn quyền thanh toán và kiểm soát workspace",
              "Editor: truy cập dự án và tài sản",
              "Viewer: chỉ xem báo cáo và preview",
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

function SettingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium">
        {value}
      </div>
    </div>
  );
}
