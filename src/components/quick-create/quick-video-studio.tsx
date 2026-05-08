"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Download, Film, Loader2, Save, Trash2, UploadCloud } from "lucide-react";
import {
  ASPECT_RATIOS,
  VIDEO_MODELS,
  type AspectRatio,
  type VideoModel,
} from "@/lib/ai/models";
import { formatCreditEstimate } from "@/lib/pricing/ui";
import type { Project } from "@/lib/projects/types";

type VideoMode = "text-to-video" | "image-to-video" | "start-end-image-to-video";

type VideoOutput = {
  id: string;
  output_url: string;
  prompt: string;
  model: string;
  persistable?: boolean;
};

type ImageSlotState = {
  file: File | null;
  url: string;
  error: string | null;
  loading: boolean;
};

const emptySlot: ImageSlotState = {
  file: null,
  url: "",
  error: null,
  loading: false,
};

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const allowedUrlPattern = /\.(jpe?g|png|webp)(\?.*)?$/i;
const QUICK_VIDEO_DURATIONS = [4, 6, 8] as const;

const actionClass =
  "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]";

export function QuickVideoStudio({
  projects,
  projectId,
  estimatedCreditCost,
  imageToVideoCreditCost,
  transitionVideoCreditCost,
}: {
  projects: Project[];
  projectId?: string;
  estimatedCreditCost: number;
  imageToVideoCreditCost: number;
  transitionVideoCreditCost: number;
}) {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<VideoModel>("veo-3-fast");
  const [videoMode, setVideoMode] = useState<VideoMode>("text-to-video");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [duration, setDuration] = useState(5);
  const [referenceAsset, setReferenceAsset] = useState<File | null>(null);
  const [startImage, setStartImage] = useState<ImageSlotState>(emptySlot);
  const [endImage, setEndImage] = useState<ImageSlotState>(emptySlot);
  const [output, setOutput] = useState<VideoOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? projects[0]?.id ?? "");

  const referencePreview = useMemo(
    () => (referenceAsset ? URL.createObjectURL(referenceAsset) : null),
    [referenceAsset],
  );
  const activeCreditCost =
    videoMode === "image-to-video"
      ? imageToVideoCreditCost || estimatedCreditCost
      : videoMode === "start-end-image-to-video"
        ? transitionVideoCreditCost || estimatedCreditCost
        : estimatedCreditCost;

  async function submit() {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (videoMode === "start-end-image-to-video" && (startImage.error || endImage.error)) {
      setError("Vui lòng sửa ảnh Start/End hợp lệ trước khi tạo video.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.set("prompt", prompt);
      formData.set("model", model);
      formData.set("aspectRatio", aspectRatio);
      formData.set("duration", String(duration));
      formData.set("videoMode", videoMode);

      if (projectId) {
        formData.set("projectId", projectId);
      }

      if (referenceAsset) {
        formData.set("referenceAsset", referenceAsset);
      }

      if (videoMode === "start-end-image-to-video" && startImage.file) {
        formData.set("startImage", startImage.file);
      }

      if (videoMode === "start-end-image-to-video" && endImage.file) {
        formData.set("endImage", endImage.file);
      }

      if (videoMode === "start-end-image-to-video" && startImage.url.trim()) {
        formData.set("startImageUrl", startImage.url.trim());
      }

      if (videoMode === "start-end-image-to-video" && endImage.url.trim()) {
        formData.set("endImageUrl", endImage.url.trim());
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
              persistable: true,
            }
          : payload.result.type === "ephemeral"
            ? {
                id: payload.result.output.id,
                output_url: payload.result.output.output_url,
                prompt: payload.result.output.prompt,
                model: payload.result.output.model,
                persistable: false,
              }
            : {
                id: payload.result.asset.id,
                output_url: payload.result.asset.output_url,
                prompt: payload.result.asset.prompt,
                model: payload.result.asset.model,
                persistable: true,
              };

      setOutput(nextOutput);
      setMessage(
        payload.result.type === "ephemeral"
          ? payload.result.warning
          : projectId
            ? "Đã tạo video và lưu vào dự án."
            : "Đã tạo video nhanh.",
      );
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

          <div className="grid gap-4 md:grid-cols-4">
            <Select
              label="Chế độ video"
              value={videoMode}
              onChange={(value) => {
                const nextMode = value as VideoMode;
                setVideoMode(nextMode);
                if (nextMode !== "start-end-image-to-video") {
                  setStartImage(emptySlot);
                  setEndImage(emptySlot);
                }
              }}
            >
              <option value="text-to-video">Text to Video</option>
              <option value="image-to-video">Image to Video</option>
              <option value="start-end-image-to-video">Start-End Image to Video</option>
            </Select>

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
              {QUICK_VIDEO_DURATIONS.map((item) => (
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

          {videoMode === "start-end-image-to-video" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ImageDropCard title="Start Image" state={startImage} onChange={setStartImage} />
              <ImageDropCard title="End Image" state={endImage} onChange={setEndImage} />
            </div>
          ) : null}

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
            <video
              src={referencePreview}
              controls
              className="aspect-video w-full rounded-2xl border border-[var(--border)]"
            />
          ) : null}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
            Ước tính credits:{" "}
            <span className="font-medium text-[var(--foreground)]">
              {formatCreditEstimate(activeCreditCost)}
            </span>
          </div>

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
              {!projectId && output.persistable !== false ? (
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

function ImageDropCard({
  title,
  state,
  onChange,
}: {
  title: string;
  state: ImageSlotState;
  onChange: (next: ImageSlotState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (state.file ? URL.createObjectURL(state.file) : state.url.trim()),
    [state.file, state.url],
  );

  function setFile(file: File | null) {
    if (!file) {
      return;
    }

    onChange({ ...emptySlot, loading: true });

    if (!allowedImageTypes.includes(file.type)) {
      onChange({
        ...emptySlot,
        error: "Ảnh phải là JPG, JPEG, PNG hoặc WEBP.",
      });
      return;
    }

    onChange({
      file,
      url: "",
      error: null,
      loading: false,
    });
  }

  function setUrl(url: string) {
    const trimmed = url.trim();

    if (!trimmed) {
      onChange({ ...state, url: "", error: null });
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      onChange({ ...state, url: trimmed, file: null, error: "Link ảnh không hợp lệ." });
      return;
    }

    if (!allowedUrlPattern.test(trimmed)) {
      onChange({
        ...state,
        url: trimmed,
        file: null,
        error: "Link phải trỏ tới ảnh JPG, JPEG, PNG hoặc WEBP.",
      });
      return;
    }

    onChange({ file: null, url: trimmed, error: null, loading: false });
  }

  function clear() {
    onChange(emptySlot);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hasImageInput(state) ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setFile(event.dataTransfer.files[0] ?? null);
        }}
        className="mt-3 flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-center"
      >
        {previewUrl && !state.error ? (
          <Image
            src={previewUrl}
            alt={title}
            width={720}
            height={540}
            unoptimized
            onError={() =>
              onChange({
                ...state,
                error: "Không thể tải preview ảnh. Hãy kiểm tra lại link hoặc file.",
              })
            }
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-3 px-4 text-sm text-[var(--muted-foreground)]">
            {state.loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <UploadCloud className="h-8 w-8" />
            )}
            Kéo ảnh vào đây hoặc nhấn để chọn ảnh
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />

      <label className="mt-3 block">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Hoặc dán link ảnh</span>
        <input
          value={state.url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/image.webp"
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
        />
      </label>

      {state.error ? (
        <p className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
          {state.error}
        </p>
      ) : hasImageInput(state) ? (
        <p className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
          Ảnh đã sẵn sàng.
        </p>
      ) : null}
    </div>
  );
}

function hasImageInput(state: ImageSlotState) {
  return Boolean(state.file || state.url.trim());
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
