"use client";

import { useState } from "react";
import { ArrowLeft, Layers3, Plus, Sparkles, Trash2 } from "lucide-react";
import { CINEMA_STYLES, type CinemaProject, type CinemaScene } from "@/lib/cinema/types";

function createEmptyScene(order: number, duration: number): CinemaScene {
  return {
    id: crypto.randomUUID(),
    projectId: "",
    sceneOrder: order,
    durationSeconds: Math.max(3, Math.round(duration / 5)),
    visualDescription: "",
    cameraAngle: "",
    cameraMovement: "",
    lighting: "",
    mood: "",
    voiceover: "",
    onScreenText: "",
    selectedTakeId: null,
    createdAt: new Date().toISOString(),
  };
}

export function CinemaScenesStep({
  project,
  scenes,
  onScenesGenerated,
  onBack,
}: {
  project: CinemaProject;
  scenes: CinemaScene[];
  onScenesGenerated: (scenes: CinemaScene[]) => void;
  onBack: () => void;
}) {
  const [items, setItems] = useState<CinemaScene[]>(
    scenes.length > 0 ? scenes : [createEmptyScene(1, project.duration)],
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedStyle = CINEMA_STYLES.find((s) => s.id === project.styleId);
  const totalDuration = items.reduce((sum, s) => sum + s.durationSeconds, 0);

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI scene generation
    await new Promise((r) => setTimeout(r, 2000));

    const sceneCount = Math.max(3, Math.round(project.duration / 6));
    const perScene = Math.round(project.duration / sceneCount);

    const generated: CinemaScene[] = Array.from({ length: sceneCount }, (_, i) => ({
      id: crypto.randomUUID(),
      projectId: project.id,
      sceneOrder: i + 1,
      durationSeconds: perScene,
      visualDescription: `[AI Generated] Scene ${i + 1} - ${project.brief.slice(0, 50)}...`,
      cameraAngle: ["close-up", "medium shot", "wide shot", "over-the-shoulder", "low angle"][i % 5],
      cameraMovement: ["dolly in", "pan left", "static", "tracking shot", "crane up"][i % 5],
      lighting: selectedStyle?.name || "cinematic",
      mood: selectedStyle?.description || "dramatic",
      voiceover: "",
      onScreenText: "",
      selectedTakeId: null,
      createdAt: new Date().toISOString(),
    }));

    setItems(generated);
    setIsGenerating(false);
  };

  const updateScene = (index: number, field: keyof CinemaScene, value: string | number) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const addScene = () => {
    setItems((current) => [
      ...current,
      createEmptyScene(current.length + 1, project.duration),
    ]);
  };

  const removeScene = (index: number) => {
    setItems((current) => {
      if (current.length <= 1) return current;
      return current.filter((_, i) => i !== index).map((s, i) => ({ ...s, sceneOrder: i + 1 }));
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--heading)]">Scene Planning</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {items.length} scenes · {totalDuration}s / {project.duration}s mục tiêu · Style: {selectedStyle?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Đang tạo..." : "AI Generate Scenes"}
          </button>
        </div>
      </div>

      {/* Scene cards */}
      <div className="space-y-4">
        {items.map((scene, index) => (
          <div key={scene.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                  {scene.sceneOrder}
                </span>
                <span className="text-sm text-[var(--muted-foreground)]">{scene.durationSeconds}s</span>
              </div>
              <button type="button" onClick={() => removeScene(index)} className="rounded-lg p-2 text-[var(--muted)] hover:text-rose-400 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Mô tả hình ảnh</label>
                <textarea
                  value={scene.visualDescription}
                  onChange={(e) => updateScene(index, "visualDescription", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  placeholder="Mô tả chi tiết hình ảnh scene này..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Thời lượng (s)</label>
                  <input type="number" value={scene.durationSeconds} onChange={(e) => updateScene(index, "durationSeconds", Number(e.target.value))} min={2} max={20} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Góc máy</label>
                  <input type="text" value={scene.cameraAngle} onChange={(e) => updateScene(index, "cameraAngle", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" placeholder="close-up, wide..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Chuyển động</label>
                  <input type="text" value={scene.cameraMovement} onChange={(e) => updateScene(index, "cameraMovement", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" placeholder="dolly, pan..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Ánh sáng</label>
                  <input type="text" value={scene.lighting} onChange={(e) => updateScene(index, "lighting", e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" placeholder="natural, dramatic..." />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={addScene} className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <Plus className="h-4 w-4" /> Thêm scene
        </button>
        <button
          type="button"
          onClick={() => onScenesGenerated(items)}
          disabled={items.length === 0 || items.every((s) => !s.visualDescription)}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
        >
          <Layers3 className="h-4 w-4" /> Tiếp tục → Render Takes
        </button>
      </div>
    </div>
  );
}
