import { generateScriptAction, updateScriptAction } from "@/lib/ai/actions";
import type { Project, ScriptRecord } from "@/lib/projects/types";

export function ScriptEditor({
  project,
  script,
}: {
  project: Project;
  script: ScriptRecord | null;
}) {
  const generatedOutput = script?.generated_output as
    | {
        productService?: string;
      }
    | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Trình tạo kịch bản AI</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Tạo kịch bản quảng cáo video ngắn tiếng Việt theo cấu trúc Hook → Vấn đề
          → Giải pháp → Sản phẩm/Dịch vụ → CTA. Mỗi lần tạo sẽ trừ tín dụng trước
          khi chạy và tự hoàn nếu tạo thất bại.
        </p>
      </div>

      <form action={generateScriptAction} className="space-y-4">
        <input type="hidden" name="projectId" value={project.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Loại sản phẩm"
            name="productType"
            defaultValue={script?.product_type || ""}
            placeholder="Mỹ phẩm, spa, thực phẩm chức năng..."
          />
          <ReadOnlyField
            label="Bối cảnh dự án"
            value={`${project.platform} / ${project.duration}s / ${project.style || "Phong cách quảng cáo social"}`}
          />
        </div>
        <TextAreaField
          label="Ý tưởng video"
          name="idea"
          defaultValue={script?.idea || project.brief || ""}
          placeholder="Mô tả ý tưởng quảng cáo, nỗi đau khách hàng, USP sản phẩm, ưu đãi và CTA mong muốn."
          rows={5}
        />
        <button
          type="submit"
          className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
        >
          Tạo kịch bản AI
        </button>
      </form>

      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="text-lg font-semibold">Kịch bản có thể chỉnh sửa</h3>
        <form action={updateScriptAction} className="mt-5 space-y-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Tiêu đề video"
              name="title"
              defaultValue={script?.title || project.title}
              placeholder="Tiêu đề video"
            />
            <Field
              label="Khách hàng mục tiêu"
              name="targetAudience"
              defaultValue={script?.target_audience || ""}
              placeholder="Mẹ bỉm, chủ shop, phụ nữ 25-35..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Ý tưởng"
              name="idea"
              defaultValue={script?.idea || project.brief || ""}
              placeholder="Ý tưởng video"
            />
            <Field
              label="Loại sản phẩm"
              name="productType"
              defaultValue={script?.product_type || ""}
              placeholder="Loại sản phẩm/dịch vụ"
            />
          </div>

          <TextAreaField
            label="Hook"
            name="hook"
            defaultValue={script?.hook || ""}
            placeholder="Câu mở đầu gây chú ý"
            rows={3}
          />
          <TextAreaField
            label="Vấn đề"
            name="problem"
            defaultValue={script?.problem || ""}
            placeholder="Nỗi đau/vấn đề khách hàng"
            rows={4}
          />
          <TextAreaField
            label="Giải pháp"
            name="solution"
            defaultValue={script?.solution || ""}
            placeholder="Giải pháp"
            rows={4}
          />
          <TextAreaField
            label="Sản phẩm / Dịch vụ"
            name="productService"
            defaultValue={generatedOutput?.productService || ""}
            placeholder="Phần giới thiệu sản phẩm/dịch vụ"
            rows={4}
          />
          <TextAreaField
            label="Lời thoại"
            name="voiceover"
            defaultValue={script?.voiceover || script?.content || ""}
            placeholder="Toàn bộ lời thoại"
            rows={8}
          />
          <TextAreaField
            label="CTA"
            name="cta"
            defaultValue={script?.cta || ""}
            placeholder="Kêu gọi hành động"
            rows={3}
          />

          <button
            type="submit"
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-5 py-3 text-sm font-medium"
          >
            Lưu chỉnh sửa kịch bản
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
        {value}
      </div>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  rows: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
      />
    </div>
  );
}
