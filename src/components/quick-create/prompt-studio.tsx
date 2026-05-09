"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy, History, ImageIcon, Sparkles, Trash2, Upload } from "lucide-react";
import type { QuickGenerationRecord } from "@/lib/ai/quick-generations";
import {
  PROMPT_STUDIO_IMAGE_TEMPLATE,
  PROMPT_STUDIO_KNOWLEDGE,
  PROMPT_STUDIO_VIDEO_TEMPLATE,
} from "@/lib/prompt-studio/knowledge";

type PromptMode = "video" | "image";
type DurationOption = "15s" | "30s" | "45s" | "60s";
type PlatformOption = "TikTok" | "Reels" | "Shorts" | "Facebook" | "Shopee" | "Website";

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
    "When reference images are provided, inspect them carefully and use them to infer composition, product shape, color palette, styling, framing, lighting, materials, and visual hierarchy.",
    "Never mention that you cannot see the image unless the image is missing or unreadable.",
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
    "Hãy phân tích ý tưởng sau và tạo prompt video hoàn chỉnh.",
    `Ý tưởng gốc: ${input.idea}`,
    `Thời lượng mục tiêu: ${input.duration}`,
    `Nền tảng: ${input.platform}`,
    `Phong cách mong muốn: ${input.style || "Chưa chỉ định"}`,
    `Ngôn ngữ nội dung: ${input.language}`,
    `Yêu cầu consistency: ${input.consistency || "Ưu tiên giữ đồng nhất nhân vật, sản phẩm, background khi hợp lý."}`,
    "Mục tiêu đầu ra:",
    "- Tạo concept video rõ ràng, có tính thương mại và khả năng sản xuất.",
    "- Chia cảnh hợp lý theo thời lượng.",
    "- Mô tả visual, camera, action, lighting, voice-over, on-screen text.",
    "- Tạo prompt riêng cho từng cảnh.",
    "- Tạo negative prompt cho từng cảnh.",
    "- Thêm consistency notes để dùng cho AI video generation.",
  ].join("\n");
}

function buildImageUserPrompt(input: {
  idea: string;
  style: string;
  platform: PlatformOption;
  language: string;
  consistency: string;
  referenceImageName: string;
}) {
  return [
    "Hãy phân tích ý tưởng sau và tạo prompt ảnh hoàn chỉnh.",
    `Ý tưởng gốc: ${input.idea}`,
    `Nền tảng sử dụng: ${input.platform}`,
    `Phong cách mong muốn: ${input.style || "Chưa chỉ định"}`,
    `Ngôn ngữ mô tả: ${input.language}`,
    `Yêu cầu consistency: ${input.consistency || "Ưu tiên giữ đồng nhất nhân vật, sản phẩm, background khi hợp lý."}`,
    input.referenceImageName
      ? `Ảnh tham chiếu đã được gửi kèm: ${input.referenceImageName}. Hãy phân tích kỹ bố cục, hình dáng, tông màu, chất liệu, typo/packaging nếu có, và đưa vào prompt một cách hữu ích.`
      : "Không có ảnh tham chiếu.",
    "Mục tiêu đầu ra:",
    "- Làm rõ concept và hướng visual.",
    "- Tối ưu bố cục, góc máy, ánh sáng, chất liệu hình ảnh.",
    "- Tạo 1 main prompt chất lượng cao.",
    "- Tạo 1 negative prompt hữu ích.",
    "- Tạo 2-3 prompt variations để test nhanh.",
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [referenceImageDataUrl, setReferenceImageDataUrl] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState("");

  function flashCopied(key: string) {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1800);
  }

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
          reference_image_name: mode === "image" ? referenceImageName || null : null,
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
      setError("Vui lòng nhập ý tưởng.");
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
          systemPrompt: mode === "video" ? buildVideoSystemPrompt() : buildImageSystemPrompt(),
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
                  referenceImageName,
                }),
          imageDataUrls:
            mode === "image" && referenceImageDataUrl ? [referenceImageDataUrl] : undefined,
          temperature: mode === "video" ? 0.7 : 0.8,
          maxTokens: mode === "video" ? 2600 : 1800,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Không thể tạo prompt AI.");
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
      setError(caught instanceof Error ? caught.message : "Không thể tạo prompt AI.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyResult() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
    flashCopied("result");
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
    setReferenceImageDataUrl(null);
    setReferenceImageName(
      typeof metadata.reference_image_name === "string" ? metadata.reference_image_name : "",
    );
    setError("");
  }

  async function handleReferenceImageChange(file: File | null) {
    if (!file) {
      setReferenceImageDataUrl(null);
      setReferenceImageName("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Ảnh tham chiếu phải là file hình ảnh hợp lệ.");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setReferenceImageDataUrl(dataUrl);
    setReferenceImageName(file.name);
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
                Đã nạp bộ kiến thức prompt để suy luận kỹ hơn trước khi tạo output.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeButton
                active={mode === "video"}
                title="Tạo prompt video"
                description="Chia cảnh, camera, voice-over, prompt từng cảnh."
                onClick={() => setMode("video")}
              />
              <ModeButton
                active={mode === "image"}
                title="Tạo prompt ảnh"
                description="Tạo main prompt, negative prompt và các biến thể."
                onClick={() => setMode("image")}
              />
            </div>

            <label className="block">
              <span className="text-sm font-medium">Ý tưởng gốc</span>
              <textarea
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                rows={7}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                placeholder={
                  mode === "video"
                    ? "Ví dụ: Viết kịch bản tạo video 30s về cô gái giới thiệu sản phẩm Romance VIP."
                    : "Ví dụ: Tạo ảnh quảng cáo serum cao cấp với cô gái châu Á, nền studio sáng, cảm giác sang trọng."
                }
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Nền tảng"
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
                  <span className="text-sm font-medium">Ngôn ngữ mô tả</span>
                  <input
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                  />
                </label>
              )}
            </div>

            <label className="block">
              <span className="text-sm font-medium">Phong cách mong muốn</span>
              <input
                value={style}
                onChange={(event) => setStyle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                placeholder="Ví dụ: cinematic luxury, social ad hiện đại, studio clean, high-energy TikTok"
              />
            </label>

            {mode === "image" ? (
              <label className="block">
                <span className="text-sm font-medium">Ảnh tham chiếu</span>
                <div className="mt-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <div className="flex flex-col gap-4">
                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      <Upload className="h-4 w-4" />
                      {referenceImageDataUrl ? "Đổi ảnh tham chiếu" : "Thêm ảnh để AI tham chiếu"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          void handleReferenceImageChange(event.target.files?.[0] ?? null)
                        }
                        className="hidden"
                      />
                    </label>

                    {referenceImageDataUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                        <div className="relative aspect-[4/3] w-full bg-[var(--surface)]">
                          <Image
                            src={referenceImageDataUrl}
                            alt={referenceImageName || "Anh tham chieu"}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-[var(--foreground)]">
                              {referenceImageName}
                            </p>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                              AI sẽ xem ảnh này để viết prompt sát hơn với bố cục, concept và chi tiết thị giác.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReferenceImageDataUrl(null);
                              setReferenceImageName("");
                            }}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
                        <ImageIcon className="h-4 w-4" />
                        Chưa có ảnh tham chiếu. Bạn có thể thêm ảnh sản phẩm, poster, bố cục mẫu hoặc visual mẫu để AI viết prompt tốt hơn.
                      </div>
                    )}
                  </div>
                </div>
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-medium">Ghi chú consistency</span>
              <textarea
                value={consistency}
                onChange={(event) => setConsistency(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                placeholder="Ví dụ: giữ nguyên cô gái châu Á 25 tuổi, váy đỏ, chai sản phẩm màu vàng champagne, nền studio trắng kem."
              />
            </label>

            {mode === "video" ? (
              <label className="block">
                <span className="text-sm font-medium">Ngôn ngữ nội dung</span>
                <input
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm outline-none"
                  placeholder="Ví dụ: Vietnamese"
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
              {loading ? "Đang tạo prompt AI..." : "Tạo Prompt AI"}
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
              <h2 className="text-xl font-semibold">Kết quả prompt</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Output dạng Markdown để bạn copy sang bước tạo ảnh hoặc tạo video.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyResult}
              disabled={!result}
              className={[
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:opacity-50",
                copiedKey === "result"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                  : "border-[var(--border)] text-[var(--muted-foreground)]",
              ].join(" ")}
            >
              {copiedKey === "result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedKey === "result" ? "Đã copy" : "Sao chép"}
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
              Chưa có kết quả. Nhập ý tưởng đơn giản, chọn chế độ rồi bấm{" "}
              <span className="font-medium text-[var(--foreground)]">Tạo Prompt AI</span>.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5" />
          <div>
            <h2 className="text-xl font-semibold">Lịch sử prompt AI</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Xem lại các prompt đã tạo và nạp lại vào studio khi cần.
            </p>
          </div>
        </div>

        {!historyAvailable ? (
          <div className="mt-5 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-8 text-sm leading-7 text-amber-700">
            Lịch sử prompt AI chưa hoạt động vì database của bạn chưa có bảng{" "}
            <code className="rounded bg-white/60 px-1 py-0.5 text-xs">quick_generations</code>.
            Cần chạy migration `0019_quick_ai_studio.sql` và `0021_prompt_history_support.sql`
            trong Supabase SQL Editor.
          </div>
        ) : history.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-[var(--border)] p-8 text-sm text-[var(--muted-foreground)]">
            Chưa có lịch sử prompt AI.
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
                      Mở lại
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Ý tưởng
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
                      onClick={async () => {
                        await navigator.clipboard.writeText(item.prompt);
                        flashCopied(`idea:${item.id}`);
                      }}
                      className={[
                        "rounded-xl border px-3 py-2 text-xs font-medium transition",
                        copiedKey === `idea:${item.id}`
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                      ].join(" ")}
                    >
                      {copiedKey === `idea:${item.id}` ? "Đã copy" : "Copy ý tưởng"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(generatedText);
                        flashCopied(`output:${item.id}`);
                      }}
                      className={[
                        "rounded-xl border px-3 py-2 text-xs font-medium transition",
                        copiedKey === `output:${item.id}`
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                          : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                      ].join(" ")}
                    >
                      {copiedKey === `output:${item.id}` ? "Đã copy" : "Copy output"}
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Khong the doc anh tham chieu."));
    reader.readAsDataURL(file);
  });
}
