"use client";

import { useState } from "react";
import { ArrowLeft, GripVertical, Music, Type } from "lucide-react";
import type { CinemaProject, CinemaScene, CinemaTake, CinemaTimelineItem, CinemaTransition } from "@/lib/cinema/types";

const TRANSITIONS: { value: CinemaTransition; label: string }[] = [
  { value: "cut", label: "Cut" },
  { value: "fade", label: "Fade" },
  { value: "dissolve", label: "Dissolve" },
  { value: "wipe", label: "Wipe" },
  { value: "zoom", label: "Zoom" },
];

export function CinemaTimelineStep({
  project,
  scenes,
  takes,
  timeline,
  onTimelineUpdated,
  onComplete,
  onBack,
}: {
  project: CinemaProject;
  scenes: CinemaScene[];
  takes: CinemaTake[];
  timeline: CinemaTimelineItem[];
  onTimelineUpdated: (timeline: CinemaTimelineItem[]) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [musicUrl, setMusicUrl] = useState<string>("");
  const [colorGrading, setColorGrading] = useState<string>("none");

  // Initialize timeline from scenes if empty
  const items: CinemaTimelineItem[] = timeline.length > 0
    ? timeline
    : scenes
        .filter((s) => s.selectedTakeId)
        .map((scene, index) => ({
          id: crypto.randomUUID(),
          projectId: project.id,
          sceneId: scene.id,
          takeId: scene.selectedTakeId!,
          order: index + 1,
          transition: index === 0 ? "cut" as CinemaTransition : "dissolve" as CinemaTransition,
          textOverlay: null,
          createdAt: new Date().toISOString(),
        }));

  const updateTransition = (itemId: string, transition: CinemaTransition) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, transition } : item,
    );
    onTimelineUpdated(updated);
  };

  const updateTextOverlay = (itemId: string, text: string) => {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, textOverlay: text || null } : item,
    );
    onTimelineUpdated(updated);
  };

  const totalDuration = items.reduce((sum, item) => {
    const scene = scenes.find((s) => s.id === item.sceneId);
    return sum + (scene?.durationSeconds || 0);
  }, 0);

  const COLOR_GRADINGS = [
    { value: "none", label: "Không" },
    { value: "warm-film", label: "Warm Film" },
    { value: "cool-blue", label: "Cool Blue" },
    { value: "vintage", label: "Vintage" },
    { value: "high-contrast", label: "High Contrast" },
    { value: "desaturated", label: "Desaturated" },
    { value: "golden-hour", label: "Golden Hour" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--heading)]">Timeline Assembly</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {items.length} clips · {totalDuration}s tổng · Sắp xếp, thêm transition và text overlay
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Timeline */}
        <div className="space-y-3">
          {items.map((item, index) => {
            const scene = scenes.find((s) => s.id === item.sceneId);
            const take = takes.find((t) => t.id === item.takeId);
            if (!scene) return null;

            return (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                {/* Transition selector (not for first item) */}
                {index > 0 && (
                  <div className="mb-3 flex items-center gap-2 border-b border-[var(--border)] pb-3">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Transition:</span>
                    <div className="flex gap-1">
                      {TRANSITIONS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => updateTransition(item.id, t.value)}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                            item.transition === t.value
                              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                              : "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <GripVertical className="mt-1 h-4 w-4 text-[var(--muted)] cursor-grab" />

                  {/* Clip preview */}
                  <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-transparent">
                    <span className="text-xs font-bold text-[var(--accent)]">Take {take?.takeNumber}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--heading)]">Scene {scene.sceneOrder}</span>
                      <span className="text-xs text-[var(--muted)]">{scene.durationSeconds}s</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--muted-foreground)]">
                      {scene.visualDescription}
                    </p>

                    {/* Text overlay */}
                    <div className="mt-2 flex items-center gap-2">
                      <Type className="h-3 w-3 text-[var(--muted)]" />
                      <input
                        type="text"
                        value={item.textOverlay || ""}
                        onChange={(e) => updateTextOverlay(item.id, e.target.value)}
                        placeholder="Text overlay (tuỳ chọn)..."
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar settings */}
        <div className="space-y-4">
          {/* Music */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--heading)]">Nhạc nền</h3>
            </div>
            <input
              type="text"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="URL nhạc nền hoặc để trống..."
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
            />
            <p className="mt-2 text-[10px] text-[var(--muted)]">Hỗ trợ MP3, WAV. Để trống nếu không cần nhạc.</p>
          </div>

          {/* Color grading */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <h3 className="text-sm font-semibold text-[var(--heading)]">Color Grading</h3>
            <div className="mt-3 space-y-1.5">
              {COLOR_GRADINGS.map((cg) => (
                <button
                  key={cg.value}
                  type="button"
                  onClick={() => setColorGrading(cg.value)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                    colorGrading === cg.value
                      ? "bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  {cg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-elevated)] p-4">
            <h3 className="text-sm font-semibold text-[var(--heading)]">Tóm tắt timeline</h3>
            <div className="mt-3 space-y-1.5 text-xs text-[var(--muted-foreground)]">
              <p>Clips: <span className="text-[var(--foreground)]">{items.length}</span></p>
              <p>Tổng thời lượng: <span className="text-[var(--foreground)]">{totalDuration}s</span></p>
              <p>Nhạc: <span className="text-[var(--foreground)]">{musicUrl ? "Có" : "Không"}</span></p>
              <p>Color: <span className="text-[var(--foreground)]">{COLOR_GRADINGS.find((c) => c.value === colorGrading)?.label}</span></p>
            </div>

            <button
              type="button"
              onClick={onComplete}
              className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)]"
            >
              Tiếp tục → Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
