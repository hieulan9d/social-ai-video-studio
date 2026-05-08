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

type QualityOption = "Nhanh" | "Chuan" | "Cao";

const modes: Array<{
  id: QuickMode;
  label: string;
  description: string;
  href: string;
}> = [
  {
    id: "text-to-image",
    label: "Text to Image",
    description: "Tao anh tu y tuong bang prompt chi tiet.",
    href: "/quick-create/image",
  },
  {
    id: "image-to-image",
    label: "Image to Image",
    description: "Dung anh tham chieu de tao bien the moi.",
    href: "/quick-create/image",
  },
  {
    id: "text-to-video",
    label: "Text to Video",
    description: "Sinh clip ngan tu mo ta va mood creative.",
    href: "/quick-create/video",
  },
  {
    id: "image-to-video",
    label: "Image to Video",
    description: "Bien anh tinh thanh video motion nhe.",
    href: "/quick-create/video",
  },
  {
    id: "start-end-image-to-video",
    label: "Start/End Image to Video",
    description: "Tao chuyen canh giua anh dau va anh cuoi.",
    href: "/quick-create/video",
  },
  {
    id: "prompt",
    label: "Prompt Generator",
    description: "Toi uu prompt truoc khi generate anh hoac video.",
    href: "/quick-create/prompt",
  },
  {
    id: "script",
    label: "Script Generator",
    description: "Tao hook, scene breakdown va CTA cho video ads.",
    href: "/quick-create/prompt",
  },
];

const aspectRatios = ["1:1", "9:16", "16:9", "4:3", "3:4"];
const durations = ["5s", "10s", "15s", "30s", "60s"];
const qualityOptions: QualityOption[] = ["Nhanh", "Chuan", "Cao"];

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
        "Ket qua se tra ve prompt anh/video, negative prompt, shot list va model de xuat.",
      routeLabel: "Mo Prompt AI",
      href: "/quick-create/prompt",
    };
  }

  if (mode === "script") {
    return {
      title: "Script Generator",
      preview: "Tao hook, scene, voice-over, CTA va khung visual cho video ngan.",
      routeLabel: "Tao kich ban",
      href: "/quick-create/prompt",
    };
  }

  if (mode === "text-to-image" || mode === "image-to-image") {
    return {
      title: "Image Preview",
      preview:
        "Preview anh, tai xuong, luu vao du an hoac tao bien the se xuat hien o panel phai.",
      routeLabel: "Di toi Tao anh",
      href: "/quick-create/image",
    };
  }

  return {
    title: "Video Preview",
    preview:
      "Preview video, trang thai xu ly va hanh dong luu vao du an se hien tai panel phai.",
    routeLabel: "Di toi Tao video",
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
  const [selectedQuality, setSelectedQuality] = useState<QualityOption>("Chuan");
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
            ? featureCosts.image_to_video || featureCosts.video_generation
            : activeMode === "start-end-image-to-video"
              ? featureCosts.transition_video || featureCosts.video_generation
              : featureCosts.video_generation,
  );

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">
          Quick create
        </p>
        <h1 className="text-3xl font-medium tracking-[-0.03em] text-[var(--heading)]">
          Tao nhanh AI
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
          Tao anh, video, prompt hoac kich ban chi trong vai buoc. Chon dung mode,
          nhap y tuong va dieu chinh nhanh truoc khi mo studio chinh.
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
                placeholder="Nhap prompt, y tuong san pham, concept quang cao hoac chien dich..."
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
                <Field label="Chon model">
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
                  label="Chon ty le"
                  value={selectedAspectRatio}
                  options={aspectRatios}
                  onChange={setSelectedAspectRatio}
                />

                <ChoiceGroup
                  label="Thoi luong"
                  value={selectedDuration}
                  options={durations}
                  onChange={setSelectedDuration}
                />

                <ChoiceGroup
                  label="Chat luong"
                  value={selectedQuality}
                  options={qualityOptions}
                  onChange={(value) => setSelectedQuality(value as QualityOption)}
                />
              </div>
            </div>

            {activeMode === "start-end-image-to-video" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <UploadBox title="Anh bat dau" subtitle="Keo tha hoac chon anh mo canh" />
                <UploadBox title="Anh ket thuc" subtitle="Keo tha hoac chon anh dong canh" />
              </div>
            ) : (
              <UploadBox
                title="Upload anh tham chieu"
                subtitle="Dung cho image to image hoac image to video"
              />
            )}

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-[var(--muted-foreground)]">Uoc tinh credits</p>
                <p className="text-lg font-medium text-[var(--heading)]">{estimatedCredits}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/quick-create/prompt"
                  className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]"
                >
                  <WandSparkles className="h-4 w-4 text-[var(--highlight)]" />
                  Toi uu prompt
                </Link>
                <Link
                  href={activeSummary.href}
                  className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
                >
                  Tao ngay
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
                    <span className="text-[var(--heading)]">Ty le:</span> {selectedAspectRatio}
                    {" · "}
                    <span className="text-[var(--heading)]">Thoi luong:</span> {selectedDuration}
                  </p>
                  <p className="mt-1">
                    <span className="text-[var(--heading)]">Chat luong:</span> {selectedQuality}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Tai xuong", "Luu vao du an", "Tao bien the", "Copy prompt"].map((action) => (
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
