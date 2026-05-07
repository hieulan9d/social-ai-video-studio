import { createProjectAction } from "@/lib/projects/actions";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  PROJECT_PLATFORMS,
  PROJECT_STATUSES,
  PROJECT_VIDEO_TYPES,
} from "@/lib/projects/types";

export function ProjectCreateForm() {
  return (
    <form action={createProjectAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label="Tiêu đề dự án"
          name="title"
          placeholder="Video quảng cáo serum Glow"
          required
        />
        <SelectField
          label="Platform"
          name="platform"
          defaultValue="TikTok"
          options={PROJECT_PLATFORMS.map((value) => ({
            label: value,
            value,
          }))}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="Loại video"
          name="videoType"
          defaultValue="text_to_video"
          options={PROJECT_VIDEO_TYPES.map((value) => ({
            label: value.replaceAll("_", " "),
            value,
          }))}
        />
        <InputField
          label="Thời lượng (giây)"
          name="duration"
          type="number"
          min={1}
          placeholder="15"
          required
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InputField label="Phong cách" name="style" placeholder="Cinematic cao cấp" />
        <InputField
          label="Ngôn ngữ"
          name="language"
          placeholder="Tiếng Việt"
          required
        />
      </div>

      <SelectField
        label="Trạng thái"
        name="status"
        defaultValue="draft"
        options={PROJECT_STATUSES.map((value) => ({
          label: value.replaceAll("_", " "),
          value,
        }))}
      />

      <TextAreaField
        label="Brief"
        name="brief"
        placeholder="Mô tả ưu đãi, khách hàng mục tiêu, góc hook và định hướng hình ảnh cho video này."
      />

      <FormSubmitButton
        pendingLabel="Đang tạo dự án..."
        className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
      >
        Tạo dự án
      </FormSubmitButton>
    </form>
  );
}

function InputField({
  label,
  name,
  placeholder,
  type = "text",
  required = false,
  min,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: "text" | "number";
  required?: boolean;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        min={min}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <textarea
        rows={6}
        name={name}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
      />
    </div>
  );
}
