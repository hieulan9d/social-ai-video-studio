"use client";

import { useState } from "react";
import { Film, Sparkles } from "lucide-react";
import { CINEMA_STYLES, type CinemaAspectRatio, type CinemaProject, type CinemaProjectSettings } from "@/lib/cinema/types";

const ASPECT_RATIOS: { value: CinemaAspectRatio; label: string; desc: string }[] = [
  { value: "16:9", label: "16:9", desc: "Landscape (YouTube, TVC)" },
  { value: "21:9", label: "21:9", desc: "Cinematic Letterbox" },
  { value: "9:16", label: "9:16", desc: "Vertical (TikTok, Reels)" },
  { value: "1:1", label: "1:1", desc: "Square (Instagram)" },
];

export function CinemaBriefStep({
  project,
  onProjectCreated,
}: {
  project: CinemaProject | null;
  onProjectCreated: (project: CinemaProject) => void;
}) {
  const [title, setTitle] = useState(project?.title || "");
  const [brief, setBrief] = useState(project?.brief || "");
  const [styleId, setStyleId] = useState(project?.styleId || "cinematic-drama");
  const [aspectRatio, setAspectRatio] = useState<CinemaAspectRatio>(project?.aspectRatio || "16:9");
  const [duration, setDuration] = useState(project?.duration || 30);
  const [takesPerScene, setTakesPerScene] = useState(project?.settings.takesPerScene || 3);
  const [quality, setQuality] = useState<"standard" | "high" | "4k">(project?.settings.quality || "high");

  const handleSubmit = () => {
    if (!title.trim() || !brief.trim()) return;

    const newProject: CinemaProject = {
      id: crypto.randomUUID(),
      userId: "",
      title: title.trim(),
      brief: brief.trim(),
      styleId,
      aspectRatio,
      duration,
      status: "draft",
      settings: {
        takesPerScene,
        quality,
        moodReferences: [],
        musicUrl: null,
        colorGrading: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onProjectCreated(newProject);
  };

  const selectedStyle = CINEMA_STYLES.find((s) => s.id === styleId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Main form */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center gap-3">
            <Film className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold text-[var(--heading)]">Brief dự án</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Tên dự án</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: TVC Thương hiệu mỹ phẩm XYZ"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Brief / Mô tả ý tưởng</label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={4}
                placeholder="Mô tả sản phẩm, thông điệp chính, đối tượng khách hàng, bối cảnh mong muốn..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Thời lượng (giây)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(15, Math.min(60, Number(e.target.value))))}
                  min={15}
                  max={60}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Số takes / scene</label>
                <select
                  value={takesPerScene}
                  onChange={(e) => setTakesPerScene(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                >
                  <option value={2}>2 takes</option>
                  <option value={3}>3 takes (khuyến nghị)</option>
                  <option value={4}>4 takes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <h3 className="text-sm font-semibold text-[var(--heading)]">Tỷ lệ khung hình</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.value}
                type="button"
                onClick={() => setAspectRatio(ar.value)}
                className={`rounded-xl border p-4 text-center transition ${
                  aspectRatio === ar.value
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/50"
                }`}
              >
                <p className="text-lg font-bold">{ar.label}</p>
                <p className="mt-1 text-[10px]">{ar.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <h3 className="text-sm font-semibold text-[var(--heading)]">Chất lượng render</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {([
              { value: "standard", label: "Standard", cost: "5 cr/take" },
              { value: "high", label: "High", cost: "8 cr/take" },
              { value: "4k", label: "4K Cinema", cost: "15 cr/take" },
            ] as const).map((q) => (
              <button
                key={q.value}
                type="button"
                onClick={() => setQuality(q.value)}
                className={`rounded-xl border p-4 text-center transition ${
                  quality === q.value
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/50"
                }`}
              >
                <p className="text-sm font-semibold">{q.label}</p>
                <p className="mt-1 text-[10px]">{q.cost}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar — Style selector */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
          <h3 className="text-sm font-semibold text-[var(--heading)]">Cinematic Style</h3>
          <div className="mt-4 space-y-2">
            {CINEMA_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setStyleId(style.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  styleId === style.id
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50"
                }`}
              >
                <p className="text-sm font-medium text-[var(--heading)]">{style.name}</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{style.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Summary & Create */}
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-elevated)] p-5">
          <h3 className="text-sm font-semibold text-[var(--heading)]">Tóm tắt</h3>
          <div className="mt-3 space-y-2 text-xs text-[var(--muted-foreground)]">
            <p>Style: <span className="text-[var(--foreground)]">{selectedStyle?.name || "—"}</span></p>
            <p>Tỷ lệ: <span className="text-[var(--foreground)]">{aspectRatio}</span></p>
            <p>Thời lượng: <span className="text-[var(--foreground)]">{duration}s</span></p>
            <p>Takes/scene: <span className="text-[var(--foreground)]">{takesPerScene}</span></p>
            <p>Chất lượng: <span className="text-[var(--foreground)]">{quality}</span></p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || !brief.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)] transition disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Tạo dự án & tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
