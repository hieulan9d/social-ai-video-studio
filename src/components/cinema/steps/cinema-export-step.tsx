"use client";

import { useState } from "react";
import { ArrowLeft, Check, Download, Film, Loader2, Sparkles } from "lucide-react";
import type { CinemaProject, CinemaScene, CinemaTake, CinemaTimelineItem } from "@/lib/cinema/types";

export function CinemaExportStep({
  project,
  scenes,
  takes,
  timeline,
  onBack,
}: {
  project: CinemaProject;
  scenes: CinemaScene[];
  takes: CinemaTake[];
  timeline: CinemaTimelineItem[];
  onBack: () => void;
}) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [includeSubtitles, setIncludeSubtitles] = useState(true);
  const [includeMusic, setIncludeMusic] = useState(true);
  const [watermark, setWatermark] = useState(false);

  const totalDuration = timeline.reduce((sum, item) => {
    const scene = scenes.find((s) => s.id === item.sceneId);
    return sum + (scene?.durationSeconds || 0);
  }, 0);

  const exportCreditCost = project.settings.quality === "4k" ? 20 : project.settings.quality === "high" ? 10 : 5;

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export
    await new Promise((r) => setTimeout(r, 4000));
    setIsExporting(false);
    setExportComplete(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--heading)]">Export Final Video</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Render video cuối cùng với tất cả layers, transitions và effects.
          </p>
        </div>
        <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6">
          <h3 className="text-sm font-semibold text-[var(--heading)]">Preview</h3>
          <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 border border-[var(--border)]">
            {exportComplete ? (
              <div className="text-center">
                <Check className="mx-auto h-12 w-12 text-emerald-400" />
                <p className="mt-3 text-sm font-medium text-emerald-400">Export hoàn tất!</p>
              </div>
            ) : isExporting ? (
              <div className="text-center">
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[var(--accent)]" />
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">Đang render final video...</p>
              </div>
            ) : (
              <div className="text-center">
                <Film className="mx-auto h-10 w-10 text-[var(--muted)]" />
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">Sẵn sàng export</p>
              </div>
            )}
          </div>

          {/* Timeline summary */}
          <div className="mt-4 flex gap-1 overflow-hidden rounded-lg">
            {timeline.map((item, index) => {
              const scene = scenes.find((s) => s.id === item.sceneId);
              const widthPercent = ((scene?.durationSeconds || 3) / totalDuration) * 100;
              const colors = ["bg-indigo-500/60","bg-cyan-500/60","bg-emerald-500/60","bg-amber-500/60","bg-rose-500/60"];
              return (
                <div
                  key={item.id}
                  className={`h-6 ${colors[index % colors.length]} flex items-center justify-center text-[9px] font-medium text-white`}
                  style={{ width: `${widthPercent}%` }}
                >
                  {widthPercent > 10 && scene?.sceneOrder}
                </div>
              );
            })}
          </div>
        </div>

        {/* Export settings */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-sm font-semibold text-[var(--heading)]">Cài đặt export</h3>

            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3">
                <span className="text-sm text-[var(--foreground)]">Phụ đề tự động</span>
                <input type="checkbox" checked={includeSubtitles} onChange={(e) => setIncludeSubtitles(e.target.checked)} className="h-4 w-4 rounded" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3">
                <span className="text-sm text-[var(--foreground)]">Nhạc nền</span>
                <input type="checkbox" checked={includeMusic} onChange={(e) => setIncludeMusic(e.target.checked)} className="h-4 w-4 rounded" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3">
                <span className="text-sm text-[var(--foreground)]">Watermark</span>
                <input type="checkbox" checked={watermark} onChange={(e) => setWatermark(e.target.checked)} className="h-4 w-4 rounded" />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
            <h3 className="text-sm font-semibold text-[var(--heading)]">Thông tin</h3>
            <div className="mt-3 space-y-2 text-xs text-[var(--muted-foreground)]">
              <p>Tên: <span className="text-[var(--foreground)]">{project.title}</span></p>
              <p>Style: <span className="text-[var(--foreground)]">{project.styleId}</span></p>
              <p>Tỷ lệ: <span className="text-[var(--foreground)]">{project.aspectRatio}</span></p>
              <p>Chất lượng: <span className="text-[var(--foreground)]">{project.settings.quality}</span></p>
              <p>Thời lượng: <span className="text-[var(--foreground)]">{totalDuration}s</span></p>
              <p>Clips: <span className="text-[var(--foreground)]">{timeline.length}</span></p>
              <p>Chi phí export: <span className="font-medium text-[var(--heading)]">{exportCreditCost} credits</span></p>
            </div>
          </div>

          {exportComplete ? (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
            >
              <Download className="h-4 w-4" /> Tải video xuống
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isExporting ? "Đang export..." : `Export Final Video (${exportCreditCost} credits)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
