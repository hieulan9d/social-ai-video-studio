import { ProjectCreateForm } from "@/components/projects/project-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function CreateProjectPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Nhập thông tin dự án"
        title="Tạo dự án"
        description="Lưu brief và các thiết lập video chính trước khi tạo kịch bản, prompt, render và export."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <ProjectCreateForm />
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-xl font-semibold">Cấu trúc dự án bao gồm</h2>
          <div className="mt-6 space-y-3">
            {[
              "Dự án riêng thuộc người dùng đang đăng nhập",
              "Dữ liệu con cho kịch bản, cảnh, prompt, tài sản, render và export",
              "Workspace chi tiết với các tab rõ ràng",
              "Sẵn sàng cho các job AI generation và video pipeline",
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
      </div>
    </div>
  );
}
