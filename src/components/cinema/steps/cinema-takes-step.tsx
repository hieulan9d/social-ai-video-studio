"use client";

import { useState } from "react";
import { ArrowLeft, Check, Film, Loader2, Play, RefreshCw } from "lucide-react";
import { CINEMA_STYLES, type CinemaProject, type CinemaScene, type CinemaTake } from "@/lib/cinema/types";

export function CinemaTakesStep({
  project,
  scenes,
  takes,
  onTakesUpdated,
  onScenesUpdated,
  onComplete,
  onBack,
}: {
  project: CinemaProject;
  scenes: CinemaScene[];
  takes: CinemaTake[];
  onTakesUpdated: (takes: CinemaTake[]) => void;
  onScenesUpdated: (scenes: CinemaScene[]) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [isRendering, setIsRendering] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(scenes[0]?.id || null);

  const selectedStyle = CINEMA_STYLES.find((s) => s.id === project.styleId);
  const allScenesHaveSelectedTake = scenes.every((s) => s.selectedTakeId);

  const handleRenderAllTakes = async () => {
    setIsRendering(true);

    const newTakes: CinemaTake[] = [];

    for (const scene of scenes) {
      for (let t = 1; t <= project.settings.takesPerScene; t++) {
        const takeId = crypto.randomUUID();
        const takePrompt = `${scene.visualDescription}. ${selectedStyle?.promptModifier || ""}. ${scene.cameraAngle}, ${scene.cameraMovement}, ${scene.lighting}. Take variation ${t}, cinematic quality, ultra realistic.`;

        const take: CinemaTake = {
          id: takeId,
          sceneId: scene.id,
          projectId: project.id,
          takeNumber: t,
          prompt: takePrompt,
          status: "rendering",
          outputUrl: null,
          thumbnailUrl: null,
          creditCost: project.settings.quality === "4k" ? 15 : project.settings.quality === "high" ? 8 : 5,
          providerJobId: null,
          errorMessage: null,
          createdAt: new Date().toISOString(),
        };
        newTakes.push(take);
        onTakesUpdated([...newTakes]);

        try {
          const res = await fetch("/api/cinema/render-take", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: takePrompt,
              duration: scene.durationSeconds,
              aspectRatio: project.settings.aspectRatio || "16:9",
              quality: project.settings.quality,
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

        onTakesUpdated([...newTakes]);
      }
    }

    setIsRendering(false);
  };

  const handleSelectTake = (sceneId: string, takeId: string) => {
    onScenesUpdated(
      scenes.map((s) => (s.id === sceneId ? { ...s, selectedTakeId: takeId } : s)),
    );
  };

  const getSceneTakes = (sceneId: string) => takes.filter((t) => t.sceneId === sceneId);
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const activeTakes = activeSceneId ? getSceneTakes(activeSceneId) : [];

  const totalCreditCost = takes.reduce((sum, t) => sum + t.creditCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--heading)]">Multi-Take Rendering</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {takes.length > 0
              ? `${takes.length} takes rendered · ${scenes.filter((s) => s.selectedTakeId).length}/${scenes.length} scenes đã chọn`
              : `${scenes.length} scenes × ${project.settings.takesPerScene} takes = ${scenes.length * project.settings.takesPerScene} takes cần render`}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          {takes.length === 0 && (
            <button
              type="button"
              onClick={handleRenderAllTakes}
              disabled={isRendering}
              className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
            >
              {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {isRendering ? "Đang render..." : `Render tất cả (~${scenes.length * project.settings.takesPerScene * (project.settings.quality === "4k" ? 15 : 8)} credits)`}
            </button>
          )}
        </div>
      </div>

      {takes.length === 0 && !isRendering ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <Film className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Nhấn "Render tất cả" để tạo {project.settings.takesPerScene} takes cho mỗi scene.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Ước tính: ~{scenes.length * project.settings.takesPerScene * (project.settings.quality === "4k" ? 15 : 8)} credits
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          {/* Scene list */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Scenes</p>
            {scenes.map((scene) => {
              const sceneTakes = getSceneTakes(scene.id);
              const isActive = activeSceneId === scene.id;
              const hasSelected = !!scene.selectedTakeId;

              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveSceneId(scene.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-[var(--border)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--heading)]">Scene {scene.sceneOrder}</span>
                    {hasSelected && <Check className="h-4 w-4 text-emerald-400" />}
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--muted-foreground)]">
                    {scene.visualDescription.slice(0, 40) || "—"}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {sceneTakes.length} takes · {scene.durationSeconds}s
                  </p>
                </button>
              );
            })}
          </div>

          {/* Takes grid */}
          <div className="space-y-4">
            {activeScene && (
              <>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-sm font-medium text-[var(--heading)]">Scene {activeScene.sceneOrder}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{activeScene.visualDescription}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeTakes.map((take) => {
                    const isSelected = activeScene.selectedTakeId === take.id;
                    return (
                      <div
                        key={take.id}
                        className={`rounded-2xl border overflow-hidden transition ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/30"
                            : "border-[var(--border)] hover:border-[var(--accent)]/50"
                        }`}
                      >
                        {/* Video preview */}
                        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[var(--accent)]/10 to-transparent">
                          {take.status === "completed" && take.outputUrl ? (
                            <video src={take.outputUrl} controls className="h-full w-full object-cover" />
                          ) : take.status === "completed" ? (
                            <Play className="h-8 w-8 text-white/60" />
                          ) : take.status === "rendering" ? (
                            <div className="text-center">
                              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--accent)]" />
                              <p className="mt-1 text-[10px] text-white/50">Đang render...</p>
                            </div>
                          ) : take.status === "failed" ? (
                            <div className="text-center px-2">
                              <p className="text-[10px] text-red-400 line-clamp-2">{take.errorMessage || "Lỗi"}</p>
                            </div>
                          ) : (
                            <Film className="h-8 w-8 text-[var(--muted)]" />
                          )}
                        </div>

                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[var(--heading)]">Take {take.takeNumber}</span>
                            <span className="text-[10px] text-[var(--muted)]">{take.creditCost} cr</span>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectTake(activeScene.id, take.id)}
                              disabled={take.status !== "completed"}
                              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                isSelected
                                  ? "bg-emerald-500 text-white"
                                  : "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              }`}
                            >
                              {isSelected ? "✓ Đã chọn" : "Chọn take này"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {takes.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <div className="text-sm text-[var(--muted-foreground)]">
            <span className="font-medium text-[var(--heading)]">{scenes.filter((s) => s.selectedTakeId).length}/{scenes.length}</span> scenes đã chọn best take
            · Tổng: <span className="font-medium text-[var(--heading)]">{totalCreditCost} credits</span>
          </div>
          <button
            type="button"
            onClick={onComplete}
            disabled={!allScenesHaveSelectedTake}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
          >
            Tiếp tục → Timeline
          </button>
        </div>
      )}
    </div>
  );
}
