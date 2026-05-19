"use client";

import { useMemo, useState } from "react";
import {
  Camera,
  Clock,
  Eye,
  Film,
  Lightbulb,
  MessageSquare,
  Move,
  Play,
  Type,
  User,
} from "lucide-react";
import type { Project, SceneRecord, ScriptRecord, PromptRecord } from "@/lib/projects/types";

type StoryboardScene = {
  id: string;
  sceneNumber: number;
  duration: number;
  visualDescription: string;
  cameraAngle: string;
  cameraMovement: string;
  subjectAction: string;
  background: string;
  lighting: string;
  voiceover: string;
  onScreenText: string;
  notes: string;
  prompt: string | null;
  timeStart: number;
  timeEnd: number;
};

function buildStoryboard(scenes: SceneRecord[], prompts: PromptRecord[]): StoryboardScene[] {
  let currentTime = 0;
  return scenes
    .sort((a, b) => a.scene_order - b.scene_order)
    .map((scene) => {
      const duration = scene.duration_seconds || 3;
      const timeStart = currentTime;
      const timeEnd = currentTime + duration;
      currentTime = timeEnd;
      const matchingPrompt = prompts.find((p) => p.scene_id === scene.id);
      return {
        id: scene.id,
        sceneNumber: scene.scene_order,
        duration,
        visualDescription: scene.visual_description || "",
        cameraAngle: scene.camera_angle || "",
        cameraMovement: scene.camera_movement || "",
        subjectAction: scene.subject_action || "",
        background: scene.background || "",
        lighting: scene.lighting || "",
        voiceover: scene.voiceover || "",
        onScreenText: scene.on_screen_text || "",
        notes: scene.notes || "",
        prompt: matchingPrompt?.content || null,
        timeStart,
        timeEnd,
      };
    });
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function StoryboardPreview({
  project,
  script,
  scenes,
  prompts,
}: {
  project: Project;
  script: ScriptRecord | null;
  scenes: SceneRecord[];
  prompts: PromptRecord[];
}) {
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");

  const storyboard = useMemo(() => buildStoryboard(scenes, prompts), [scenes, prompts]);
  const totalDuration = useMemo(
    () => storyboard.reduce((sum, s) => sum + s.duration, 0),
    [storyboard],
  );
  const selectedItem = storyboard.find((s) => s.id === selectedScene);

  if (scenes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--heading)]">Storyboard Preview</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Xem trước flow video trước khi render. Cần tạo cảnh trước.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <Film className="mx-auto h-10 w-10 text-[var(--muted)]" />
          <p className="mt-4 text-sm text-[var(--muted-foreground)]">
            Chưa có cảnh nào. Hãy vào tab Tổng quan để tạo cảnh từ kịch bản.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--heading)]">Storyboard Preview</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Xem trước flow video {totalDuration}s · {storyboard.length} cảnh · {project.platform}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("timeline")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
              viewMode === "timeline"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border border-[var(--border)] text-[var(--muted-foreground)]"
            }`}
          >
            Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
              viewMode === "grid"
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "border border-[var(--border)] text-[var(--muted-foreground)]"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Script summary */}
      {script && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Kịch bản</p>
          <p className="mt-2 text-sm font-medium text-[var(--heading)]">{script.title || project.title}</p>
          {script.hook && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Hook: {script.hook}</p>
          )}
        </div>
      )}

      {/* Timeline bar */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>0:00</span>
          <span className="font-medium text-[var(--heading)]">
            Tổng: {formatTime(totalDuration)} / Mục tiêu: {formatTime(project.duration)}
          </span>
          <span>{formatTime(totalDuration)}</span>
        </div>
        <div className="mt-3 flex h-8 overflow-hidden rounded-lg">
          {storyboard.map((scene, index) => {
            const widthPercent = (scene.duration / totalDuration) * 100;
            const colors = ["bg-indigo-500/80","bg-cyan-500/80","bg-emerald-500/80","bg-amber-500/80","bg-rose-500/80","bg-purple-500/80","bg-teal-500/80","bg-orange-500/80"];
            const color = colors[index % colors.length];
            const isSelected = selectedScene === scene.id;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => setSelectedScene(scene.id === selectedScene ? null : scene.id)}
                className={`relative flex items-center justify-center text-[10px] font-medium text-white transition-all ${color} ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-[var(--background)]" : ""} ${index > 0 ? "border-l border-black/20" : ""}`}
                style={{ width: `${widthPercent}%` }}
                title={`Cảnh ${scene.sceneNumber} · ${scene.duration}s`}
              >
                {widthPercent > 8 && <span>{scene.sceneNumber}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scene cards */}
      {viewMode === "timeline" ? (
        <div className="space-y-3">
          {storyboard.map((scene, index) => (
            <SceneCard key={scene.id} scene={scene} index={index} isSelected={selectedScene === scene.id} onSelect={() => setSelectedScene(scene.id === selectedScene ? null : scene.id)} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {storyboard.map((scene, index) => (
            <SceneCardCompact key={scene.id} scene={scene} index={index} isSelected={selectedScene === scene.id} onSelect={() => setSelectedScene(scene.id === selectedScene ? null : scene.id)} />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedItem && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-elevated)] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--heading)]">Chi tiết cảnh {selectedItem.sceneNumber}</h3>
            <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-xs font-medium text-[var(--accent)]">
              {formatTime(selectedItem.timeStart)} – {formatTime(selectedItem.timeEnd)}
            </span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <DetailField icon={Eye} label="Mô tả hình ảnh" value={selectedItem.visualDescription} />
            <DetailField icon={MessageSquare} label="Lời thoại" value={selectedItem.voiceover} />
            <DetailField icon={Camera} label="Góc máy" value={selectedItem.cameraAngle} />
            <DetailField icon={Move} label="Chuyển động" value={selectedItem.cameraMovement} />
            <DetailField icon={User} label="Hành động" value={selectedItem.subjectAction} />
            <DetailField icon={Lightbulb} label="Ánh sáng" value={selectedItem.lighting} />
            <DetailField icon={Type} label="Chữ trên màn hình" value={selectedItem.onScreenText} />
            <DetailField icon={Film} label="Bối cảnh" value={selectedItem.background} />
          </div>
          {selectedItem.prompt && (
            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Veo Prompt (English)</p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{selectedItem.prompt}</p>
            </div>
          )}
        </div>
      )}

      {/* Cost estimate */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--heading)]">Ước tính render</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{storyboard.length} cảnh × chi phí render mỗi cảnh</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-[var(--heading)]">~{storyboard.length * 5} credits</p>
            <p className="text-xs text-[var(--muted-foreground)]">Ước tính · có thể thay đổi theo mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneCard({ scene, index, isSelected, onSelect }: { scene: StoryboardScene; index: number; isSelected: boolean; onSelect: () => void }) {
  const colors = ["border-l-indigo-500","border-l-cyan-500","border-l-emerald-500","border-l-amber-500","border-l-rose-500","border-l-purple-500","border-l-teal-500","border-l-orange-500"];
  const borderColor = colors[index % colors.length];
  return (
    <button type="button" onClick={onSelect} className={`w-full rounded-xl border-l-4 ${borderColor} border border-[var(--border)] bg-[var(--surface-elevated)] p-4 text-left transition hover:bg-[var(--surface-muted)] ${isSelected ? "ring-1 ring-[var(--accent)]" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-[var(--heading)]">{scene.sceneNumber}</span>
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
              <Clock className="h-3 w-3" />
              <span>{scene.duration}s</span>
              <span className="text-[var(--muted)]">·</span>
              <span>{formatTime(scene.timeStart)} – {formatTime(scene.timeEnd)}</span>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-[var(--foreground)]">{scene.visualDescription || "Chưa có mô tả hình ảnh"}</p>
          {scene.voiceover && <p className="mt-1 line-clamp-1 text-xs text-[var(--muted-foreground)]">🎙️ {scene.voiceover}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 text-[10px] text-[var(--muted)]">
          {scene.cameraAngle && <span>📷 {scene.cameraAngle}</span>}
          {scene.cameraMovement && <span>🎬 {scene.cameraMovement}</span>}
        </div>
      </div>
    </button>
  );
}

function SceneCardCompact({ scene, index, isSelected, onSelect }: { scene: StoryboardScene; index: number; isSelected: boolean; onSelect: () => void }) {
  const bgColors = ["from-indigo-500/20","from-cyan-500/20","from-emerald-500/20","from-amber-500/20","from-rose-500/20","from-purple-500/20","from-teal-500/20","from-orange-500/20"];
  const bgColor = bgColors[index % bgColors.length];
  return (
    <button type="button" onClick={onSelect} className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden text-left transition hover:bg-[var(--surface-muted)] ${isSelected ? "ring-1 ring-[var(--accent)]" : ""}`}>
      <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${bgColor} to-transparent`}>
        <div className="text-center">
          <Play className="mx-auto h-6 w-6 text-white/60" />
          <p className="mt-1 text-xs font-medium text-white/80">{scene.duration}s</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--heading)]">Cảnh {scene.sceneNumber}</span>
          <span className="text-[10px] text-[var(--muted)]">{formatTime(scene.timeStart)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">{scene.visualDescription || "Chưa có mô tả"}</p>
      </div>
    </button>
  );
}

function DetailField({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[var(--muted)]" />
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</span>
      </div>
      <p className="mt-2 text-sm text-[var(--foreground)]">{value}</p>
    </div>
  );
}
