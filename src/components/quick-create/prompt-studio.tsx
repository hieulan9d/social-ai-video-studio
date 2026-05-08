"use client";

import { useState } from "react";
import { Copy, History, Sparkles } from "lucide-react";

import type { QuickGenerationRecord } from "@/lib/ai/quick-generations";
import {
  PROMPT_STUDIO_IMAGE_TEMPLATE,
  PROMPT_STUDIO_KNOWLEDGE,
  PROMPT_STUDIO_VIDEO_TEMPLATE,
} from "@/lib/prompt-studio/knowledge";

type PromptMode = "video" | "image";

type DurationOption = "15s" | "30s" | "45s" | "60s";
type PlatformOption =
  | "TikTok"
  | "Reels"
  | "Shorts"
  | "Facebook"
  | "Shopee"
  | "Website";

const durationOptions: DurationOption[] = ["15s", "30s", "45s", "60s"];
const platformOptions: PlatformOption[] = [
  "TikTok",
  "Reels",
  "Shorts",
  "Facebook",
  "Shopee",
  "Website",
];

function buildVideoSystemPrompt() {
  return [
    "You are Prompt Studio, an expert AI creative strategist for short-form commercial video generation.",
    "Your job is to transform a rough user idea into a production-ready prompt package for AI video generation.",
    "Always reason deeply before writing the final answer.",
    "Use the knowledge base below as operating rules.",
    "",
    "KNOWLEDGE BASE",
    PROMPT_STUDIO_KNOWLEDGE,
    "",
    "OUTPUT REQUIREMENTS",
    "Return Markdown only.",
    "Write all explanations, analysis, and notes in Vietnamese.",
    "Write every actual generation prompt and negative prompt in English.",
    "Be concrete. Do not stay generic.",
    "Preserve product, character, wardrobe, logo, packaging, and background consistency when relevant.",
    "If the user mentions a brand or product, infer a commercially useful visual direction instead of asking follow-up questions.",
    "If the brief is incomplete, make reasonable creative assumptions and state them briefly in the concept.",
    "",
    "TARGET OUTPUT TEMPLATE",
    PROMPT_STUDIO_VIDEO_TEMPLATE,
  ].join("\n");
}

function buildImageSystemPrompt() {
  return [
    "You are Prompt Studio, an expert AI prompt engineer for commercial image generation.",
    "Your job is to transform a rough user idea into a sharp, production-ready image prompt package.",
    "Use the knowledge base below as operating rules.",
    "",
    "KNOWLEDGE BASE",
    PROMPT_STUDIO_KNOWLEDGE,
    "",
    "OUTPUT REQUIREMENTS",
    "Return Markdown only.",
    "Write all explanations, analysis, and notes in Vietnamese.",
    "Write every actual generation prompt and negative prompt in English.",
    "Optimize for commercial and social-media-ready visuals.",
    "When the user is vague, infer a strong composition, lighting setup, and platform-appropriate framing.",
    "",
    "TARGET OUTPUT TEMPLATE",
    PROMPT_STUDIO_IMAGE_TEMPLATE,
  ].join("\n");
}

function buildVideoUserPrompt(input: {
  idea: string;
  duration: DurationOption;
  platform: PlatformOption;
  style: string;
  language: string;
  consistency: string;
}) {
  return [
    "Hay phan tich y tuong sau va tao prompt video hoan chinh.",
    `Y tuong goc: ${input.idea}`,
    `Thoi luong muc tieu: ${input.duration}`,
    `Nen tang: ${input.platform}`,
    `Phong cach mong muon: ${input.style || "Chua chi dinh"}`,
    `Ngon ngu noi dung: ${input.language}`,
    `Yeu cau consistency: ${input.consistency || "Uu tien giu dong nhat nhan vat, san pham, background khi hop ly."}`,
    "Muc tieu dau ra:",
    "- Tao concept video ro rang, co tinh thuong mai va kha nang san xuat.",
    "- Chia canh hop ly theo thoi luong.",
    "- Mo ta visual, camera, action, lighting, voice-over, on-screen text.",
    "- Tao prompt rieng cho tung canh.",
    "- Tao negative prompt cho tung canh.",
    "- Them consistency notes de dung cho AI video generation.",
  ].join("\n");
}

function buildImageUserPrompt(input: {
  idea: string;
  style: string;
  platform: PlatformOption;
  language: string;
  consistency: string;
}) {
  return [
    "Hay phan tich y tuong sau va tao prompt anh hoan chinh.",
    `Y tuong goc: ${input.idea}`,
    `Nen tang su dung: ${input.platform}`,
    `Phong cach mong muon: ${input.style || "Chua chi dinh"}`,
    `Ngon ngu mo ta: ${input.language}`,
    `Yeu cau consistency: ${input.consistency || "Uu tien giu dong nhat nhan vat, san pham, background khi hop ly."}`,
    "Muc tieu dau ra:",
    "- Lam ro concept va huong visual.",
    "- Toi uu bo cuc, goc may, anh sang, chat lieu hinh anh.",
    "- Tao 1 main prompt chat luong cao.",
    "- Tao 1 negative prompt huu ich.",
    "- Tao 2-3 prompt variations de test nhanh.",
  ].join("\n");
}

function readGeneratedText(metadata: Record<string, unknown>) {
  return typeof metadata.generated_text === "string" ? metadata.generated_text : "";
}

type PromptStudioProps = {
  initialHistory: QuickGenerationRecord[];
  historyAvailable: boolean;
};

export function PromptStudio({ initialHistory, historyAvailable }: PromptStudioProps) {
  const [mode, setMode] = useState<PromptMode>("video");
  const [idea, setIdea] = useState("");
  const [duration, setDuration] = useState<DurationOption>("30s");
  const [platform, setPlatform] = useState<PlatformOption>("TikTok");
  const [style, setStyle] = useState("");
  const [language, setLanguage] = useState("Vietnamese");
  const [consistency, setConsistency] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [model, setModel] = useState("");
  const [history, setHistory] = useState(initialHistory);

  async function persistPromptHistory(generatedText: string, usedModel: string) {
    const response = await fetch("/api/quick-generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "prompt",
        prompt: idea.trim(),
        model: usedModel || "unknown",
        status: "completed",
        metadata: {
          generated_text: generatedText,
          prompt_mode: mode,
          platform,
          duration: mode === "video" ? duration : null,
          style,
          language,
          consistency,
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      throw new Error(payload.error ?? "Khong the luu lich su prompt AI.");
    }

    if (payload.warning) {
      setWarning(String(payload.warning));
      return;
    }

    if (payload.generation) {
      setHistory((current) => [
        payload.generation as QuickGenerationRecord,
        ...current.filter((item) => item.id !== payload.generation.id).slice(0, 11),
      ]);
    }
  }

  async function handleGenerate() {
    if (!idea.trim()) {
      setError("Vui long nhap y tuong.");
      return;
    }

    setLoading(true);
    setError("");
    setWarning("");
    setResult("");

    try {
      const response = await fetch("/api/ai/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: mode === "video" ? "reasoning" : "prompt",
          systemPrompt:
            mode === "video" ? buildVideoSystemPrompt() : buildImageSystemPrompt(),
          prompt:
            mode === "video"
              ? buildVideoUserPrompt({
                  idea,
                  duration,
                  platform,
                  style,
                  language,
                  consistency,
                })
              : buildImageUserPrompt({
                  idea,
                  style,
                  platform,
                  language,
                  consistency,
                }),
          temperature: mode === "video" ? 0.7 : 0.8,
          maxTokens: mode === "video" ? 2600 : 1800,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Khong the tao prompt AI.");
      }

      const generatedText = String(payload.text ?? "");
      const usedModel = String(payload.model ?? "");

      setResult(generatedText);
      setModel(usedModel);

      try {
        await persistPromptHistory(generatedText, usedModel);
      } catch (historyError) {
        setWarning(
          historyError instanceof Error
            ? historyError.message
            : "Khong the luu lich su prompt AI.",
        );
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Khong the tao prompt AI.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyResult() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
  }

  function loadHistoryItem(item: QuickGenerationRecord) {
    const metadata = item.metadata ?? {};
    const historyMode = metadata.prompt_mode === "image" ? "image" : "video";

    setMode(historyMode);
    setIdea(item.prompt);
    setResult(readGeneratedText(metadata));
    setModel(item.model);
    setPlatform(
      metadata.platform === "Reels" ||
        metadata.platform === "Shorts" ||
        metadata.platform === "Facebook" ||
        metadata.platform === "Shopee" ||
        metadata.platform === "Website"
        ? metadata.platform
        : "TikTok",
    );
    setDuration(
      metadata.duration === "15s" ||
        metadata.duration === "45s" ||
        metadata.duration === "60s"
        ? metadata.duration
        : "30s",
    );
    setStyle(typeof metadata.style === "string" ? metadata.style : "");
    setLanguage(typeof metadata.language === "string" ? metadata.language : "Vietnamese");
    setConsistency(typeof metadata.consistency === "string" ? metadata.consistency : "");
    setError("");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <div>
              <h2 className="text-xl font-semibold">Prompt Studio</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Da nap bo kien thuc prompt de suy luan ky hon truoc khi tao output.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeButton
                active={mode === "video"}
                title="Tao prompt video"
                description="Chia canh, camera, voice-over, prompt tung canh."
                onClick={() => setMode("video")}
              />
              <ModeButton
                active={mode === "image"}
                title="Tao prompt anh"
                description="Tao main prompt, negative prompt va cac bien the."
                onClick={() => setMode("image")}
              />
            </div>

            <label className="block">
              <span className="text-sm font-medium">Y tuong goc</span>
              <textarea
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                rows={7}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                placeholder={
                  mode === "video"
                    ? "Vi du: Viet kich ban tao video 30s ve co gai gioi thieu san pham Romance VIP."
                    : "Vi du: Tao anh quang cao serum cao cap voi co gai chau A, nen studio sang, cam giac sang trong."
                }
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Nen tang"
                value={platform}
                onChange={(value) => setPlatform(value as PlatformOption)}
              >
                {platformOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>

              {mode === "video" ? (
                <Select
                  label="Thoi luong"
                  value={duration}
                  onChange={(value) => setDuration(value as DurationOption)}
                >
                  {durationOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              ) : (
                <label className="block">
                  <span className="text-sm font-medium">Ngon ngu mo ta</span>
                  <input
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                  />
                </label>
              )}
            </div>

            <label className="block">
              <span className="text-sm font-medium">Phong cach mong muon</span>
              <input
                value={style}
                onChange={(event) => setStyle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                placeholder="Vi du: cinematic luxury, social ad hien dai, studio clean, high-energy TikTok"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Ghi chu consistency</span>
              <textarea
                value={consistency}
                onChange={(event) => setConsistency(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                placeholder="Vi du: giu nguyen co gai chau A 25 tuoi, vay do, chai san pham mau vang champagne, nen studio trang kem."
              />
            </label>

            {mode === "video" ? (
              <label className="block">
                <span className="text-sm font-medium">Ngon ngu noi dung</span>
                <input
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                  placeholder="Vi du: Vietnamese"
                />
              </label>
            ) : null}

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] disabled:opacity-60"
            >
              {loading ? <Sparkles className="h-4 w-4 animate-pulse" /> : null}
              {loading ? "Dang tao prompt AI..." : "Tao Prompt AI"}
            </button>

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {warning ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                {warning}
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Ket qua prompt</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Output dang Markdown de ban copy sang buoc tao anh hoac tao video.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyResult}
              disabled={!result}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Sao chep
            </button>
          </div>

          {model ? (
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
              Model: {model}
            </p>
          ) : null}

          {result ? (
            <pre className="mt-5 overflow-x-auto whitespace-pre-wrap rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 text-sm leading-7 text-[var(--foreground)]">
              {result}
            </pre>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-[var(--border)] p-8 text-sm leading-7 text-[var(--muted-foreground)]">
              Chua co ket qua. Nhap y tuong don gian, chon che do roi bam{" "}
              <span className="font-medium text-[var(--foreground)]">Tao Prompt AI</span>.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">Lich su prompt AI</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Xem lai cac prompt da tao va nap lai vao studio khi can.
            </p>
          </div>
        </div>

        {!historyAvailable ? (
          <div className="mt-5 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-8 text-sm leading-7 text-amber-700">
            Lich su prompt AI chua hoat dong vi database cua ban chua co bang{" "}
            <code className="rounded bg-white/60 px-1 py-0.5 text-xs">quick_generations</code>.
            Can chay migration `0019_quick_ai_studio.sql` va `0021_prompt_history_support.sql`
            trong Supabase SQL Editor.
          </div>
        ) : history.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--muted-foreground)]">
            Chua co lich su prompt AI.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {history.map((item) => {
              const generatedText = readGeneratedText(item.metadata);
              const promptMode = item.metadata.prompt_mode === "image" ? "Image" : "Video";

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                        {promptMode} / {item.model}
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadHistoryItem(item)}
                      className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Mo lai
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Y tuong
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--foreground)]">
                        {item.prompt}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Output
                      </p>
                      <pre className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
                        {generatedText}
                      </pre>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(item.prompt)}
                      className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Copy y tuong
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedText)}
                      className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    >
                      Copy output
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-3xl border p-4 text-left transition",
        active
          ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
          : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)]",
      ].join(" ")}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p
        className={[
          "mt-2 text-sm leading-6",
          active ? "text-[var(--background)]/80" : "text-[var(--muted-foreground)]",
        ].join(" ")}
      >
        {description}
      </p>
    </button>
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
