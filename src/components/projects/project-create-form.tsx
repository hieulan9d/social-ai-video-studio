import { createProjectAction } from "@/lib/projects/actions";
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
          label="Project title"
          name="title"
          placeholder="Glow serum product ad"
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
          label="Video type"
          name="videoType"
          defaultValue="text_to_video"
          options={PROJECT_VIDEO_TYPES.map((value) => ({
            label: value.replaceAll("_", " "),
            value,
          }))}
        />
        <InputField
          label="Duration (seconds)"
          name="duration"
          type="number"
          min={1}
          placeholder="15"
          required
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InputField label="Style" name="style" placeholder="Luxury cinematic" />
        <InputField
          label="Language"
          name="language"
          placeholder="Vietnamese"
          required
        />
      </div>

      <SelectField
        label="Status"
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
        placeholder="Describe the offer, target audience, hook angle, and visual direction for this video project."
      />

      <button
        type="submit"
        className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
      >
        Create project
      </button>
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
