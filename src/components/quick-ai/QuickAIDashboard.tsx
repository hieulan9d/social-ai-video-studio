"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Clapperboard,
  FileText,
  ImageIcon,
  MoveDiagonal,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from "lucide-react";
import type { FeatureCostMap } from "@/lib/pricing/ui";
import { formatCreditEstimate } from "@/lib/pricing/ui";

type QuickMode =
  | "text-to-image"
  | "image-to-image"
  | "text-to-video"
  | "image-to-video"
  | "start-end-image-to-video"
  | "prompt"
  | "script";

type QualityOption = "Nhanh" | "Chuẩn" | "Cao";

const modes: Array<{
  id: QuickMode;
  label: string;
  description: string;
  href: string;
}> = [
  {
    id: "text-to-image",
    label: "Text to Image",
    description: "Tạo ảnh từ ý tưởng bằng prompt chi tiết.",
    href: "/quick-create/image",
  },
  {
    id: "image-to-image",
    label: "Image to Image",
    description: "Dùng ảnh tham chiếu để tạo biến thể mới.",
    href: "/quick-create/image",
  },
  {
    id: "text-to-video",
    label: "Text to Video",
    description: "Sinh clip ngắn từ mô tả và mood creative.",
    href: "/quick-create/video",
  },
  {
    id: "image-to-video",
    label: "Image to Video",
    description: "Biến ảnh tĩnh thành video motion nhẹ.",
    href: "/quick-create/video",
  },
  {
    id: "start-end-image-to-video",
    label: "Start/End Image to Video",
    description: "Tạo chuyển cảnh giữa ảnh đầu và ảnh cuối.",
    href: "/quick-create/video",
  },
  {
    id: "prompt",
    label: "Prompt Generator",
    description: "Tối ưu prompt trước khi generate ảnh hoặc video.",
    href: "/quick-create/prompt",
  },
  {
    id: "script",
    label: "Script Generator",
    description: "Tạo hook, scene breakdown và CTA cho video ads.",
    href: "/quick-create/prompt",
  },
];

const aspectRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"];
const durations = ["5s", "10s", "15s", "30s", "60s"];
const qualityOptions: QualityOption[] = ["Nhanh", "Chuẩn", "Cao"];

function getModeIcon(mode: QuickMode) {
  if (mode === "text-to-image" || mode === "image-to-image") return ImageIcon;
  if (mode === "prompt") return Sparkles;
  if (mode === "script") return FileText;
  if (mode === "start-end-image-to-video") return MoveDiagonal;
  return Clapperboard;
}

function renderModeIcon(mode: QuickMode, className: string) {
  if (mode === "text-to-image" || mode === "image-to-image") {
    return <ImageIcon className={className} />;
  }

  if (mode === "prompt") {
    return <Sparkles className={className} />;
  }

  if (mode === "script") {
    return <FileText className={className} />;
  }

  if (mode === "start-end-image-to-video") {
    return <MoveDiagonal className={className} />;
  }

  return <Clapperboard className={className} />;
}

function getModeSummary(mode: QuickMode) {
  if (mode === "prompt") {
    return {
      title: "Prompt Generator",
      preview:
        "Kết quả sẽ trả về prompt ảnh/video, negative prompt, shot list và model đề xuất.",
      routeLabel: "Mở Prompt AI",
      href: "/quick-create/prompt",
    };
  }

  if (mode === "script") {
    return {
      title: "Script Generator",
      preview: "Tạo hook, scene, voice-over, CTA và khung visual cho video ngắn.",
      routeLabel: "Tạo kịch bản",
      href: "/quick-create/prompt",
    };
  }

  if (mode === "text-to-image" || mode === "image-to-image") {
    return {
      title: "Image Preview",
      preview:
        "Preview ảnh, tải xuống, lưu vào dự án hoặc tạo biến thể sẽ xuất hiện ở panel phải.",
      routeLabel: "Đi tới Tạo ảnh",
      href: "/quick-create/image",
    };
  }

  return {
    title: "Video Preview",
    preview:
      "Preview video, trạng thái xử lý và hành động lưu vào dự án sẽ hiện tại panel phải.",
    routeLabel: "Đi tới Tạo video",
    href: "/quick-create/video",
  };
}

function getModelOptions(mode: QuickMode) {
  if (mode === "prompt") {
    return ["GPT Prompt Writer", "Gemini Prompt Writer", "GPT Reasoning"];
  }

  if (mode === "script") {
    return ["Gemini Script Writer", "GPT Script Writer", "Gemini Reasoning"];
  }

  if (mode.includes("video")) {
    return ["Google Veo", "Veo Fast", "Google Veo Transition"];
  }

  return ["GPT Image", "Gemini Image", "Gemini Flash Image"];
}

export default function QuickAIDashboard({
  initialMode = "prompt",
  featureCosts,
}: {
  initialMode?: QuickMode;
  featureCosts: FeatureCostMap;
}) {
  const [activeMode, setActiveMode] = useState<QuickMode>(initialMode);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const modelOptions = useMemo(() => getModelOptions(activeMode), [activeMode]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("9:16");
  const [selectedDuration, setSelectedDuration] = useState("15s");
  const [selectedQuality, setSelectedQuality] = useState<QualityOption>("Chuẩn");
  const activeSummary = getModeSummary(activeMode);
  const resolvedModel =
    selectedModel && modelOptions.includes(selectedModel)
      ? selectedModel
      : (modelOptions[0] ?? "");

  const estimatedCredits = formatCreditEstimate(
    activeMode === "prompt"
      ? featureCosts.prompt_generation
      : activeMode === "script"
        ? featureCosts.text_generation
        : activeMode === "text-to-image" || activeMode === "image-to-image"
          ? featureCosts.image_generation
          : activeMode === "image-to-video"
            ? featureCosts.image_to_video
            : activeMode === "start-end-image-to-video"
              ? featureCosts.transition_video
              : featureCosts.veo_render,
  );

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Quick create
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--heading)]">
          Tạo nhanh AI
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
          Tạo ảnh, video, prompt hoặc kịch bản chỉ trong vài bước. Chọn đúng mode, nhập ý tưởng
          và điều chỉnh nhanh trước khi mở studio chính.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[var(--radius-shell)] border bg-[var(--surface)] p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {modes.map((mode) => {
              const Icon = getModeIcon(mode.id);
              const active = activeMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setActiveMode(mode.id)}
                  className={[
                    "rounded-[12px] border p-4 text-left",
                    active
                      ? "border-[#29508d] bg-[#111c35]"
                      : "border-[var(--border)] bg-[var(--surface-muted)]",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--highlight)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-[var(--heading)]">{mode.label}</p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            <Field label="Prompt">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={6}
                placeholder="Nhập prompt, ý tưởng sản phẩm, concept quảng cáo hoặc chiến dịch..."
                className="w-full rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Negative prompt">
                <textarea
                  value={negativePrompt}
                  onChange={(event) => setNegativePrompt(event.target.value)}
                  rows={4}
                  placeholder="No blur, no watermark, no extra fingers..."
                  className="w-full rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                />
              </Field>
              <div className="space-y-4">
                <Field label="Chọn model">
                  <select
                    value={resolvedModel}
                    onChange={(event) => setSelectedModel(event.target.value)}
                    className="w-full rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]"
                  >
                    {modelOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <ChoiceGroup
                  label="Chọn tỷ lệ"
                  value={selectedAspectRatio}
                  options={aspectRatios}
                  onChange={setSelectedAspectRatio}
                />

                <ChoiceGroup
                  label="Thời lượng"
                  value={selectedDuration}
                  options={durations}
                  onChange={setSelectedDuration}
                />

                <ChoiceGroup
                  label="Chất lượng"
                  value={selectedQuality}
                  options={qualityOptions}
                  onChange={(value) => setSelectedQuality(value as QualityOption)}
                />
              </div>
            </div>

            {activeMode === "start-end-image-to-video" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <UploadBox title="Ảnh bắt đầu" subtitle="Kéo thả hoặc chọn ảnh mở cảnh" />
                <UploadBox title="Ảnh kết thúc" subtitle="Kéo thả hoặc chọn ảnh đóng cảnh" />
              </div>
            ) : (
              <UploadBox
                title="Upload ảnh tham chiếu"
                subtitle="Dùng cho image to image hoặc image to video"
              />
            )}

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-[var(--muted-foreground)]">Ước tính credits</p>
                <p className="text-lg font-medium text-[var(--heading)]">{estimatedCredits}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/quick-create/prompt"
                  className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]"
                >
                  <WandSparkles className="h-4 w-4 text-[var(--highlight)]" />
                  Tối ưu prompt
                </Link>
                <Link
                  href={activeSummary.href}
                  className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
                >
                  Tạo ngay
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-shell)] border bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                Preview / output
              </p>
              <h2 className="mt-2 text-xl font-medium text-[var(--heading)]">
                {activeSummary.title}
              </h2>
            </div>
            <span className="rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--highlight)]">
              {activeMode}
            </span>
          </div>

          <div className="mt-5 flex min-h-[360px] flex-col justify-between rounded-[12px] border bg-[var(--surface-muted)] p-5">
            <div className="flex flex-1 items-center justify-center rounded-[12px] border border-dashed bg-[#101a2f] text-center">
              <div className="max-w-md space-y-3 px-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--highlight)]">
                  {renderModeIcon(activeMode, "h-6 w-6")}
                </div>
                <p className="text-sm leading-7 text-[var(--muted-foreground)]">
                  {activeSummary.preview}
                </p>
                <div className="rounded-[12px] border bg-[var(--surface)] px-4 py-3 text-left text-sm text-[var(--muted-foreground)]">
                  <p>
                    <span className="text-[var(--heading)]">Model:</span> {resolvedModel}
                  </p>
                  <p className="mt-1">
                    <span className="text-[var(--heading)]">Tỷ lệ:</span> {selectedAspectRatio}
                    {" · "}
                    <span className="text-[var(--heading)]">Thời lượng:</span> {selectedDuration}
                  </p>
                  <p className="mt-1">
                    <span className="text-[var(--heading)]">Chất lượng:</span> {selectedQuality}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Tải xuống", "Lưu vào dự án", "Tạo biến thể", "Copy prompt"].map((action) => (
                <div
                  key={action}
                  className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted-foreground)]"
                >
                  {action}
                </div>
              ))}
            </div>

            <Link
              href={activeSummary.href}
              className="mt-5 inline-flex items-center gap-2 text-sm text-[var(--highlight)]"
            >
              {activeSummary.routeLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--foreground)]">{label}</p>
      {children}
    </div>
  );
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={[
                "rounded-full border px-3 py-1.5 text-xs",
                active
                  ? "border-[#29508d] bg-[#1a3a7a] text-[var(--heading)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UploadBox({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button
      type="button"
      className="rounded-[12px] border border-dashed bg-[var(--surface-muted)] p-5 text-center"
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--highlight)]">
        <UploadCloud className="h-4 w-4" />
      </div>
      <p className="mt-3 text-sm font-medium text-[var(--heading)]">{title}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{subtitle}</p>
    </button>
  );
}
