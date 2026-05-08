"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Download, ImagePlus, Loader2, Save, Trash2 } from "lucide-react";
import {
  ASPECT_RATIOS,
  IMAGE_MODELS,
  type AspectRatio,
  type ImageModel,
} from "@/lib/ai/models";
import type { Project } from "@/lib/projects/types";

type OutputItem = {
  id: string;
  output_url: string;
  prompt: string;
  model: string;
};

const actionClass =
  "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]";

export function QuickImageStudio({
  projects,
  projectId,
}: {
  projects: Project[];
  projectId?: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<ImageModel>("gpt-image");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [quantity, setQuantity] = useState(1);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? projects[0]?.id ?? "");

  const referencePreview = useMemo(
    () => (referenceImage ? URL.createObjectURL(referenceImage) : null),
    [referenceImage],
  );

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("prompt", prompt);
      formData.set("model", model);
      formData.set("aspectRatio", aspectRatio);
      formData.set("quantity", String(quantity));

      if (projectId) {
        formData.set("projectId", projectId);
      }

      if (referenceImage) {
        formData.set("referenceImage", referenceImage);
      }

      const response = await fetch("/api/generate/image", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Tạo ảnh thất bại.");
      }

      const nextOutputs: OutputItem[] =
        payload.result.type === "quick"
          ? payload.result.generations.map((item: OutputItem) => ({
              id: item.id,
              output_url: item.output_url,
              prompt: item.prompt,
              model: item.model,
            }))
          : payload.result.assets.map((item: { id: string; output_url: string; prompt: string; model: string }) => ({
              id: item.id,
              output_url: item.output_url,
              prompt: item.prompt,
              model: item.model,
            }));

      setOutputs(nextOutputs);
      setMessage(projectId ? "Đã tạo ảnh và lưu vào dự án." : "Đã tạo ảnh nhanh.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tạo ảnh thất bại.");
    } finally {
      setLoading(false);
    }
  }

  async function saveToProject(output: OutputItem) {
    if (!selectedProjectId) {
      setError("Vui lòng chọn dự án để lưu.");
      return;
    }

    const response = await fetch(`/api/quick-generations/${output.id}/save-to-project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProjectId }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Không thể lưu vào dự án.");
      return;
    }

    setMessage("Đã lưu output vào dự án.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3">
          <ImagePlus className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Tạo ảnh nhanh</h2>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
              placeholder="Mô tả ảnh bạn muốn tạo..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <Select label="Model" value={model} onChange={(value) => setModel(value as ImageModel)}>
              {IMAGE_MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>

            <Select
              label="Tỷ lệ khung hình"
              value={aspectRatio}
              onChange={(value) => setAspectRatio(value as AspectRatio)}
            >
              {ASPECT_RATIOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <label className="block">
            <span className="text-sm font-medium">Số lượng ảnh</span>
            <input
              type="number"
              min={1}
              max={4}
              value={quantity}
              onChange={(event) => setQuantity(Number.parseInt(event.target.value, 10))}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Ảnh tham chiếu tùy chọn</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setReferenceImage(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm"
            />
          </label>

          {referencePreview ? (
            <Image
              src={referencePreview}
              alt="Ảnh tham chiếu"
              width={960}
              height={540}
              unoptimized
              className="aspect-video w-full rounded-2xl border border-[var(--border)] object-cover"
            />
          ) : null}

          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Đang tạo ảnh..." : "Generate"}
          </button>

          <Status message={message} error={error} />
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-xl font-semibold">Preview ảnh</h2>
        {outputs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            Chưa có ảnh nào. Nhập prompt và bấm Generate để bắt đầu.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {outputs.map((output) => (
              <article key={output.id} className="rounded-2xl border border-[var(--border)] p-3">
                <Image
                  src={output.output_url}
                  alt={output.prompt}
                  width={768}
                  height={768}
                  unoptimized
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={output.output_url} download className={actionClass}>
                    <Download className="h-4 w-4" />
                    Tải xuống
                  </a>
                  {!projectId ? (
                    <button type="button" onClick={() => saveToProject(output)} className={actionClass}>
                      <Save className="h-4 w-4" />
                      Lưu vào dự án
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOutputs((current) => current.filter((item) => item.id !== output.id))}
                    className={actionClass}
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!projectId && projects.length > 0 ? (
          <label className="mt-6 block">
            <span className="text-sm font-medium">Dự án để lưu output</span>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function Status({ message, error }: { message: string | null; error: string | null }) {
  if (!message && !error) {
    return null;
  }

  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3 text-sm",
        error
          ? "border-red-500/30 bg-red-500/10 text-red-600"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      ].join(" ")}
    >
      {error ?? message}
    </div>
  );
}
