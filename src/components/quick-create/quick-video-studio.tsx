"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Download, Film, Loader2, Save } from "lucide-react";
import {
  ASPECT_RATIOS,
  VIDEO_DURATIONS,
  VIDEO_MODELS,
  type AspectRatio,
  type VideoModel,
} from "@/lib/ai/models";
import type { Project } from "@/lib/projects/types";

type VideoOutput = {
  id: string;
  output_url: string;
  prompt: string;
  model: string;
};

const actionClass =
  "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]";

export function QuickVideoStudio({
  projects,
  projectId,
}: {
  projects: Project[];
  projectId?: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<VideoModel>("veo");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [duration, setDuration] = useState(5);
  const [referenceAsset, setReferenceAsset] = useState<File | null>(null);
  const [output, setOutput] = useState<VideoOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? projects[0]?.id ?? "");

  const referencePreview = useMemo(
    () => (referenceAsset ? URL.createObjectURL(referenceAsset) : null),
    [referenceAsset],
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
      formData.set("duration", String(duration));

      if (projectId) {
        formData.set("projectId", projectId);
      }

      if (referenceAsset) {
        formData.set("referenceAsset", referenceAsset);
      }

      const response = await fetch("/api/generate/video", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Tạo video thất bại.");
      }

      const nextOutput: VideoOutput =
        payload.result.type === "quick"
          ? {
              id: payload.result.generation.id,
              output_url: payload.result.generation.output_url,
              prompt: payload.result.generation.prompt,
              model: payload.result.generation.model,
            }
          : {
              id: payload.result.asset.id,
              output_url: payload.result.asset.output_url,
              prompt: payload.result.asset.prompt,
              model: payload.result.asset.model,
            };

      setOutput(nextOutput);
      setMessage(projectId ? "Đã tạo video và lưu vào dự án." : "Đã tạo video nhanh.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tạo video thất bại.");
    } finally {
      setLoading(false);
    }
  }

  async function saveToProject() {
    if (!output || !selectedProjectId) {
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
          <Film className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Tạo video nhanh</h2>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
              placeholder="Mô tả video bạn muốn tạo..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Model" value={model} onChange={(value) => setModel(value as VideoModel)}>
              {VIDEO_MODELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>

            <Select
              label="Thời lượng"
              value={String(duration)}
              onChange={(value) => setDuration(Number.parseInt(value, 10))}
            >
              {VIDEO_DURATIONS.map((item) => (
                <option key={item} value={item}>
                  {item} giây
                </option>
              ))}
            </Select>

            <Select
              label="Tỷ lệ"
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
            <span className="text-sm font-medium">Ảnh/video tham chiếu tùy chọn</span>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(event) => setReferenceAsset(event.target.files?.[0] ?? null)}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm"
            />
          </label>

          {referencePreview && referenceAsset?.type.startsWith("image/") ? (
            <Image
              src={referencePreview}
              alt="Reference"
              width={960}
              height={540}
              unoptimized
              className="aspect-video w-full rounded-2xl border border-[var(--border)] object-cover"
            />
          ) : null}

          {referencePreview && referenceAsset?.type.startsWith("video/") ? (
            <video src={referencePreview} controls className="aspect-video w-full rounded-2xl border border-[var(--border)]" />
          ) : null}

          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Đang tạo video..." : "Generate"}
          </button>

          <Status message={message} error={error} />
        </div>
      </section>

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-xl font-semibold">Preview video</h2>
        {!output ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            Chưa có video nào. Nhập prompt và bấm Generate để bắt đầu.
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-[var(--border)] p-3">
            <video src={output.output_url} controls className="aspect-video w-full rounded-xl bg-black" />
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={output.output_url} download className={actionClass}>
                <Download className="h-4 w-4" />
                Tải xuống
              </a>
              {!projectId ? (
                <button type="button" onClick={saveToProject} className={actionClass}>
                  <Save className="h-4 w-4" />
                  Lưu vào dự án
                </button>
              ) : null}
            </div>
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
