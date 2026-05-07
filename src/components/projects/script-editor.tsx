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
        <h2 className="text-xl font-semibold">AI Script Generator</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Generate a Vietnamese short-form ad script with the structure Hook →
          Problem → Solution → Product/Service → CTA. One generation deducts 1
          credit before running and refunds automatically if generation fails.
        </p>
      </div>

      <form action={generateScriptAction} className="space-y-4">
        <input type="hidden" name="projectId" value={project.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Product type"
            name="productType"
            defaultValue={script?.product_type || ""}
            placeholder="Mỹ phẩm, spa, thực phẩm chức năng..."
          />
          <ReadOnlyField
            label="Project context"
            value={`${project.platform} · ${project.duration}s · ${project.style || "Social ad style"}`}
          />
        </div>
        <TextAreaField
          label="Video idea"
          name="idea"
          defaultValue={script?.idea || project.brief || ""}
          placeholder="Mô tả ý tưởng quảng cáo, nỗi đau khách hàng, USP sản phẩm, ưu đãi và CTA mong muốn."
          rows={5}
        />
        <button
          type="submit"
          className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
        >
          Generate AI script
        </button>
      </form>

      <div className="border-t border-[var(--border)] pt-6">
        <h3 className="text-lg font-semibold">Editable script</h3>
        <form action={updateScriptAction} className="mt-5 space-y-4">
          <input type="hidden" name="projectId" value={project.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Video title"
              name="title"
              defaultValue={script?.title || project.title}
              placeholder="Tiêu đề video"
            />
            <Field
              label="Target audience"
              name="targetAudience"
              defaultValue={script?.target_audience || ""}
              placeholder="Mẹ bỉm, chủ shop, phụ nữ 25-35..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Idea"
              name="idea"
              defaultValue={script?.idea || project.brief || ""}
              placeholder="Ý tưởng video"
            />
            <Field
              label="Product type"
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
            label="Problem"
            name="problem"
            defaultValue={script?.problem || ""}
            placeholder="Nỗi đau/vấn đề khách hàng"
            rows={4}
          />
          <TextAreaField
            label="Solution"
            name="solution"
            defaultValue={script?.solution || ""}
            placeholder="Giải pháp"
            rows={4}
          />
          <TextAreaField
            label="Product / Service"
            name="productService"
            defaultValue={generatedOutput?.productService || ""}
            placeholder="Phần giới thiệu sản phẩm/dịch vụ"
            rows={4}
          />
          <TextAreaField
            label="Voiceover"
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
            Save script edits
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
