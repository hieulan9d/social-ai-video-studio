"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Download,
  Film,
  ImageIcon,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";

const DURATION_OPTIONS = [
  { value: 3, label: "3s" },
  { value: 5, label: "5s" },
  { value: 8, label: "8s" },
  { value: 10, label: "10s" },
];

const TAKES_OPTIONS = [
  { value: 1, label: "1 take" },
  { value: 2, label: "2 takes" },
  { value: 3, label: "3 takes" },
];

const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard", cost: 6 },
  { value: "high", label: "High", cost: 10 },
  { value: "4k", label: "4K Cinema", cost: 18 },
] as const;

const ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "16:9", desc: "Landscape" },
  { value: "9:16", label: "9:16", desc: "Vertical" },
  { value: "1:1", label: "1:1", desc: "Square" },
] as const;

const PROMPT_TEMPLATES = [
  "Camera dolly forward smoothly, cinematic motion",
  "Slow zoom out revealing the full scene",
  "Subject turns head naturally with soft motion blur",
  "Smooth pan left across the environment",
  "Camera crane up with parallax depth",
  "Gentle transition between poses, natural movement",
  "Object rotates slowly with dramatic lighting",
  "Lighting shifts from warm to cool, time passing",
  "Subtle breathing motion, lifelike stillness to movement",
  "Pull focus from foreground to background",
];

const CINEMATIC_ENHANCER = ", cinematic quality, smooth natural motion, photorealistic, film grain, no morphing artifacts, no plastic look, professional cinematography";

type FrameTransitionTake = {
  id: string;
  takeNumber: number;
  status: "queued" | "rendering" | "completed" | "failed";
  outputUrl: string | null;
  errorMessage: string | null;
};

type HistoryItem = {
  id: string;
  startFrame: string;
  endFrame: string;
  prompt: string;
  duration: number;
  quality: string;
  createdAt: string;
};

export function CinemaFrameTransition() {
  const [startFrame, setStartFrame] = useState<string | null>(null);
  const [endFrame, setEndFrame] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(5);
  const [takesCount, setTakesCount] = useState(2);
  const [quality, setQuality] = useState<"standard" | "high" | "4k">("high");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [takes, setTakes] = useState<FrameTransitionTake[]>([]);
  const [selectedTakeId, setSelectedTakeId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dragOverStart, setDragOverStart] = useState(false);
  const [dragOverEnd, setDragOverEnd] = useState(false);

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const qualityOption = QUALITY_OPTIONS.find((q) => q.value === quality)!;
  const totalCost = qualityOption.cost * takesCount;

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string | null) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setter(reader.result as string); };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    setter: (url: string | null) => void,
    setDragState: (v: boolean) => void,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragState(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => { if (reader.result) setter(reader.result as string); };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Upgrade 2: Swap frames
  const handleSwapFrames = () => {
    const temp = startFrame;
    setStartFrame(endFrame);
    setEndFrame(temp);
  };

  // Upgrade 3: AI Suggest prompt (real API)
  const handleAISuggest = async () => {
    if (!startFrame || !endFrame) return;
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/cinema/suggest-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.suggestion) {
        setPrompt(data.suggestion);
      }
    } catch { /* ignore */ }
    setIsSuggesting(false);
  };

  const handleRender = async () => {
    if (!startFrame || !endFrame || !prompt.trim()) return;
    setIsRendering(true);
    setTakes([]);
    setSelectedTakeId(null);

    // Save to history
    setHistory((prev) => [{
      id: crypto.randomUUID(),
      startFrame: startFrame,
      endFrame: endFrame,
      prompt: prompt,
      duration,
      quality,
      createdAt: new Date().toISOString(),
    }, ...prev].slice(0, 10));

    // Render each take via real API
    const newTakes: FrameTransitionTake[] = [];

    for (let i = 0; i < takesCount; i++) {
      const takeId = crypto.randomUUID();
      const take: FrameTransitionTake = {
        id: takeId,
        takeNumber: i + 1,
        status: "rendering",
        outputUrl: null,
        errorMessage: null,
      };
      newTakes.push(take);
      setTakes([...newTakes]);

      try {
        const res = await fetch("/api/cinema/render-transition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startFrameUrl: startFrame,
            endFrameUrl: endFrame,
            prompt: finalPrompt,
            duration,
            aspectRatio,
            quality,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          take.status = "failed";
          take.errorMessage = data.error || "Render thất bại";
        } else {
          take.status = "completed";
          take.outputUrl = data.outputUrl;
        }
      } catch (err) {
        take.status = "failed";
        take.errorMessage = err instanceof Error ? err.message : "Lỗi kết nối";
      }

      setTakes([...newTakes]);
    }

    setIsRendering(false);
  };

  const handleTemplateClick = (template: string) => {
    setPrompt((prev) => prev.trim() ? `${prev.trim()}. ${template}` : template);
  };

  // Upgrade 6: Load from history
  const handleLoadHistory = (item: HistoryItem) => {
    setStartFrame(item.startFrame);
    setEndFrame(item.endFrame);
    setPrompt(item.prompt);
    setDuration(item.duration);
    setTakes([]);
    setSelectedTakeId(null);
  };

  const canRender = startFrame && endFrame && prompt.trim().length > 0;
  const finalPrompt = autoEnhance ? prompt.trim() + CINEMATIC_ENHANCER : prompt.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--heading)]">Start/End Frame Transition</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Upload 2 ảnh và viết prompt mô tả chuyển động. AI tạo video cinematic mượt mà giữa 2 frame.
        </p>
      </div>

      {/* Frame upload area with drag feedback (Upgrade 1) */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        {/* Start Frame */}
        <div
          className={`rounded-2xl border-2 transition-all p-4 ${
            dragOverStart
              ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.02]"
              : "border-[var(--border)] bg-[var(--surface-elevated)]"
          }`}
          onDrop={(e) => handleDrop(e, setStartFrame, setDragOverStart)}
          onDragOver={handleDragOver}
          onDragEnter={() => setDragOverStart(true)}
          onDragLeave={() => setDragOverStart(false)}
        >
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Start Frame</p>
          {startFrame ? (
            <div className="relative mt-3">
              <Image src={startFrame} alt="Start frame" width={400} height={300} unoptimized className="w-full rounded-xl object-cover aspect-video" />
              {/* Aspect ratio overlay */}
              <div className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] text-white/80">
                {aspectRatio}
              </div>
              <button type="button" onClick={() => setStartFrame(null)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => startInputRef.current?.click()} className="mt-3 flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] transition hover:border-[var(--accent)]">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-[var(--muted)]" />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{dragOverStart ? "Thả ảnh vào đây" : "Kéo thả hoặc click"}</p>
              </div>
            </button>
          )}
          <input ref={startInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setStartFrame)} />
        </div>

        {/* Arrow + Swap button (Upgrade 2) */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)]">
            <ArrowRight className="h-5 w-5 text-[var(--accent)]" />
          </div>
          {startFrame && endFrame && (
            <button type="button" onClick={handleSwapFrames} className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-2 py-1.5 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition" title="Hoán đổi Start ↔ End">
              <ArrowLeftRight className="h-3 w-3" /> Swap
            </button>
          )}
        </div>

        {/* End Frame */}
        <div
          className={`rounded-2xl border-2 transition-all p-4 ${
            dragOverEnd
              ? "border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.02]"
              : "border-[var(--border)] bg-[var(--surface-elevated)]"
          }`}
          onDrop={(e) => handleDrop(e, setEndFrame, setDragOverEnd)}
          onDragOver={handleDragOver}
          onDragEnter={() => setDragOverEnd(true)}
          onDragLeave={() => setDragOverEnd(false)}
        >
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">End Frame</p>
          {endFrame ? (
            <div className="relative mt-3">
              <Image src={endFrame} alt="End frame" width={400} height={300} unoptimized className="w-full rounded-xl object-cover aspect-video" />
              {/* Aspect ratio overlay */}
              <div className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] text-white/80">
                {aspectRatio}
              </div>
              <button type="button" onClick={() => setEndFrame(null)} className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => endInputRef.current?.click()} className="mt-3 flex aspect-video w-full items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] transition hover:border-[var(--accent)]">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-[var(--muted)]" />
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{dragOverEnd ? "Thả ảnh vào đây" : "Kéo thả hoặc click"}</p>
              </div>
            </button>
          )}
          <input ref={endInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setEndFrame)} />
        </div>
      </div>

      {/* Preview animation between frames */}
      {startFrame && endFrame && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Play className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Xem trước chuyển cảnh</h3>
            <span className="text-[10px] text-[var(--muted)]">(crossfade preview)</span>
          </div>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            <Image
              src={startFrame}
              alt="Start"
              fill
              unoptimized
              className="object-cover animate-[fadeOut_4s_ease-in-out_infinite]"
            />
            <Image
              src={endFrame}
              alt="End"
              fill
              unoptimized
              className="object-cover animate-[fadeIn_4s_ease-in-out_infinite]"
            />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80">Start → End preview</span>
              <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80">{duration}s</span>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn {
              0%, 40% { opacity: 0; }
              60%, 100% { opacity: 1; }
            }
            @keyframes fadeOut {
              0%, 40% { opacity: 1; }
              60%, 100% { opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Prompt section with AI Suggest (Upgrade 3) and Auto-enhance (Upgrade 5) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Prompt chuyển động</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Suggest button */}
            {startFrame && endFrame && (
              <button type="button" onClick={handleAISuggest} disabled={isSuggesting} className="flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1.5 text-[10px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/20 disabled:opacity-50">
                {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                AI Gợi ý
              </button>
            )}
            {/* Auto-enhance toggle (Upgrade 5) */}
            <label className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--muted-foreground)] cursor-pointer hover:text-[var(--foreground)] transition">
              <input type="checkbox" checked={autoEnhance} onChange={(e) => setAutoEnhance(e.target.checked)} className="h-3 w-3 rounded" />
              <Zap className="h-3 w-3" />
              Cinematic enhance
            </label>
          </div>
        </div>

        {/* Template chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PROMPT_TEMPLATES.map((template) => (
            <button key={template} type="button" onClick={() => handleTemplateClick(template)} className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-[10px] text-[var(--muted-foreground)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]">
              {template.slice(0, 35)}{template.length > 35 ? "..." : ""}
            </button>
          ))}
        </div>

        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="VD: Camera dolly forward smoothly while the subject turns their head..." className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]" />

        {autoEnhance && prompt.trim() && (
          <div className="mt-2 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/20 px-3 py-2">
            <p className="text-[10px] text-[var(--accent)]">✨ Enhanced prompt preview:</p>
            <p className="mt-1 text-[10px] text-[var(--muted-foreground)] line-clamp-2">{finalPrompt}</p>
          </div>
        )}
      </div>

      {/* Settings with Aspect Ratio (Upgrade 7) */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Thời lượng</p>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {DURATION_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setDuration(opt.value)} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${duration === opt.value ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--border)] text-[var(--muted-foreground)]"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Số takes</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {TAKES_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setTakesCount(opt.value)} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${takesCount === opt.value ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--border)] text-[var(--muted-foreground)]"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Chất lượng</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {QUALITY_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setQuality(opt.value)} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${quality === opt.value ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--border)] text-[var(--muted-foreground)]"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {/* Aspect Ratio (Upgrade 7) */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-xs font-medium text-[var(--muted)]">Tỷ lệ output</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {ASPECT_RATIO_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setAspectRatio(opt.value)} className={`rounded-lg px-2 py-2 text-xs font-medium transition ${aspectRatio === opt.value ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "border border-[var(--border)] text-[var(--muted-foreground)]"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render button */}
      <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <div className="text-sm text-[var(--muted-foreground)]">
          <span className="font-medium text-[var(--heading)]">{takesCount} takes</span> × {qualityOption.cost} cr = <span className="font-semibold text-[var(--heading)]">{totalCost} credits</span>
          <span className="ml-2 text-xs text-[var(--muted)]">· {duration}s · {quality} · {aspectRatio}</span>
        </div>
        <button type="button" onClick={handleRender} disabled={!canRender || isRendering} className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition disabled:opacity-50">
          {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
          {isRendering ? "Đang render..." : "Render Video"}
        </button>
      </div>

      {/* Output takes with side-by-side preview (Upgrade 4) */}
      {takes.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
          <h3 className="text-sm font-semibold text-[var(--heading)]">Kết quả ({takes.length} takes)</h3>

          {/* Side-by-side input preview (Upgrade 4) */}
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-2">
            {startFrame && <Image src={startFrame} alt="Start" width={80} height={45} unoptimized className="h-11 w-20 rounded-lg object-cover" />}
            <ArrowRight className="h-4 w-4 text-[var(--muted)] shrink-0" />
            {endFrame && <Image src={endFrame} alt="End" width={80} height={45} unoptimized className="h-11 w-20 rounded-lg object-cover" />}
            <span className="ml-2 text-[10px] text-[var(--muted-foreground)] truncate">{prompt.slice(0, 50)}...</span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {takes.map((take) => {
              const isSelected = selectedTakeId === take.id;
              return (
                <div key={take.id} className={`rounded-xl border overflow-hidden transition ${isSelected ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-[var(--border)] hover:border-[var(--accent)]/50"}`}>
                  <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10">
                    {take.status === "rendering" ? (
                      <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 text-[var(--accent)] animate-spin" />
                        <p className="mt-2 text-[10px] text-white/50">Đang render take {take.takeNumber}...</p>
                      </div>
                    ) : take.status === "failed" ? (
                      <div className="text-center px-3">
                        <X className="mx-auto h-6 w-6 text-red-400" />
                        <p className="mt-1 text-[10px] text-red-400 line-clamp-2">{take.errorMessage}</p>
                      </div>
                    ) : take.outputUrl ? (
                      <video src={take.outputUrl} controls className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Play className="mx-auto h-8 w-8 text-white/60" />
                        <p className="mt-1 text-[10px] text-white/50">{duration}s · {aspectRatio}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--heading)]">Take {take.takeNumber}</span>
                      <span className="text-[10px] text-[var(--muted)]">{qualityOption.cost} cr</span>
                    </div>
                    <button type="button" onClick={() => setSelectedTakeId(take.id)} className={`mt-2 w-full rounded-lg px-3 py-2 text-xs font-medium transition ${isSelected ? "bg-emerald-500 text-white" : "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                      {isSelected ? "✓ Đã chọn" : "Chọn take này"}
                    </button>
                    {take.outputUrl && (
                      <a
                        href={take.outputUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 block w-full text-center rounded-lg border border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
                      >
                        Mở video ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTakeId && (
            <div className="mt-4 flex justify-end">
              <button type="button" className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700">
                <Download className="h-4 w-4" /> Download video
              </button>
            </div>
          )}
        </div>
      )}

      {/* History (Upgrade 6) */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--muted)]" />
            <h3 className="text-sm font-semibold text-[var(--heading)]">Lịch sử gần đây</h3>
          </div>
          <div className="mt-3 space-y-2">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLoadHistory(item)}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] p-3 text-left transition hover:border-[var(--accent)]/50 hover:bg-[var(--surface-muted)]"
              >
                <Image src={item.startFrame} alt="" width={48} height={27} unoptimized className="h-7 w-12 rounded object-cover" />
                <ArrowRight className="h-3 w-3 text-[var(--muted)] shrink-0" />
                <Image src={item.endFrame} alt="" width={48} height={27} unoptimized className="h-7 w-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs text-[var(--foreground)]">{item.prompt}</p>
                  <p className="text-[10px] text-[var(--muted)]">{item.duration}s · {item.quality} · {new Date(item.createdAt).toLocaleTimeString("vi-VN")}</p>
                </div>
                <RefreshCw className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
