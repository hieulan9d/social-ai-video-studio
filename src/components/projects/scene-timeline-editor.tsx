"use client";

import { useMemo, useState } from "react";
import { generateScenesAction, saveScenesAction } from "@/lib/scenes/actions";
import type { Project, SceneRecord, ScriptRecord } from "@/lib/projects/types";

type EditableScene = {
  sceneNumber: number;
  durationSeconds: number;
  visualDescription: string;
  cameraAngle: string;
  cameraMovement: string;
  subjectAction: string;
  background: string;
  lighting: string;
  voiceover: string;
  onScreenText: string;
  notes: string;
};

function mapScene(scene: SceneRecord): EditableScene {
  return {
    sceneNumber: scene.scene_order,
    durationSeconds: scene.duration_seconds || 1,
    visualDescription: scene.visual_description || "",
    cameraAngle: scene.camera_angle || "",
    cameraMovement: scene.camera_movement || "",
    subjectAction: scene.subject_action || "",
    background: scene.background || "",
    lighting: scene.lighting || "",
    voiceover: scene.voiceover || "",
    onScreenText: scene.on_screen_text || "",
    notes: scene.notes || "",
  };
}

function createEmptyScene(sceneNumber: number): EditableScene {
  return {
    sceneNumber,
    durationSeconds: 3,
    visualDescription: "",
    cameraAngle: "",
    cameraMovement: "",
    subjectAction: "",
    background: "",
    lighting: "",
    voiceover: "",
    onScreenText: "",
    notes: "",
  };
}

export function SceneTimelineEditor({
  project,
  script,
  scenes,
}: {
  project: Project;
  script: ScriptRecord | null;
  scenes: SceneRecord[];
}) {
  const [items, setItems] = useState<EditableScene[]>(
    scenes.length > 0 ? scenes.map(mapScene) : [createEmptyScene(1)],
  );

  const totalDuration = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.durationSeconds || 0), 0),
    [items],
  );

  const durationDelta = totalDuration - project.duration;

  const syncSceneNumbers = (nextItems: EditableScene[]) =>
    nextItems.map((item, index) => ({
      ...item,
      sceneNumber: index + 1,
    }));

  const updateScene = (
    index: number,
    field: keyof EditableScene,
    value: string | number,
  ) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const moveScene = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return syncSceneNumbers(next);
    });
  };

  const addScene = () => {
    setItems((current) => syncSceneNumbers([...current, createEmptyScene(current.length + 1)]));
  };

  const deleteScene = (index: number) => {
    setItems((current) => {
      if (current.length === 1) {
        return [createEmptyScene(1)];
      }

      return syncSceneNumbers(current.filter((_, itemIndex) => itemIndex !== index));
    });
  };

  const serializedScenes = JSON.stringify(items);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tách cảnh tự động</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Tạo các cảnh sẵn sàng đưa vào timeline từ kịch bản và bối cảnh dự án.
          Mỗi lần tạo sẽ trừ tín dụng trước khi chạy và tự hoàn nếu tạo thất bại.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <form action={generateScenesAction} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <input type="hidden" name="projectId" value={project.id} />
          <p className="text-sm font-medium">Tạo cảnh từ kịch bản</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Bối cảnh đầu vào: {project.platform} / {project.duration}s /{" "}
            {project.style || "Phong cách quảng cáo social"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Trạng thái kịch bản: {script ? "Đã có" : "Chưa có kịch bản"}
          </p>
          <button
            type="submit"
            disabled={!script}
            className="mt-4 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] disabled:opacity-50"
          >
            Tạo cảnh bằng AI
          </button>
        </form>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-sm font-medium">Kiểm tra thời lượng</p>
          <p className="mt-3 text-3xl font-semibold">
            {totalDuration}s / {project.duration}s
          </p>
          <p
            className={[
              "mt-2 text-sm",
              Math.abs(durationDelta) <= 2 ? "text-emerald-400" : "text-amber-300",
            ].join(" ")}
          >
            {Math.abs(durationDelta) <= 2
              ? "Tổng thời lượng đang nằm trong mức cho phép."
              : `Hãy chỉnh cảnh để lệch tối đa 2 giây so với mục tiêu (${durationDelta > 0 ? "+" : ""}${durationDelta}s).`}
          </p>
        </div>
      </div>

      <form action={saveScenesAction} className="space-y-4">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="scenes" value={serializedScenes} />

        <div className="space-y-4">
          {items.map((scene, index) => (
            <div
              key={`${scene.sceneNumber}-${index}`}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold">Cảnh {scene.sceneNumber}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Thứ tự timeline #{scene.sceneNumber}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveScene(index, -1)}
                    className="rounded-2xl border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    Chuyển lên
                  </button>
                  <button
                    type="button"
                    onClick={() => moveScene(index, 1)}
                    className="rounded-2xl border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    Chuyển xuống
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteScene(index)}
                    className="rounded-2xl border border-rose-500/30 px-3 py-2 text-sm text-rose-300"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <TextAreaField
                  label="Mô tả hình ảnh"
                  value={scene.visualDescription}
                  onChange={(value) => updateScene(index, "visualDescription", value)}
                  rows={4}
                />
                <TextAreaField
                  label="Lời thoại"
                  value={scene.voiceover}
                  onChange={(value) => updateScene(index, "voiceover", value)}
                  rows={4}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field
                  label="Thời lượng giây"
                  type="number"
                  value={String(scene.durationSeconds)}
                  onChange={(value) =>
                    updateScene(index, "durationSeconds", Number.parseInt(value || "0", 10))
                  }
                />
                <Field
                  label="Góc máy"
                  value={scene.cameraAngle}
                  onChange={(value) => updateScene(index, "cameraAngle", value)}
                />
                <Field
                  label="Chuyển động máy"
                  value={scene.cameraMovement}
                  onChange={(value) => updateScene(index, "cameraMovement", value)}
                />
                <Field
                  label="Hành động chủ thể"
                  value={scene.subjectAction}
                  onChange={(value) => updateScene(index, "subjectAction", value)}
                />
                <Field
                  label="Bối cảnh nền"
                  value={scene.background}
                  onChange={(value) => updateScene(index, "background", value)}
                />
                <Field
                  label="Ánh sáng"
                  value={scene.lighting}
                  onChange={(value) => updateScene(index, "lighting", value)}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextAreaField
                  label="Chữ trên màn hình"
                  value={scene.onScreenText}
                  onChange={(value) => updateScene(index, "onScreenText", value)}
                  rows={3}
                />
                <TextAreaField
                  label="Ghi chú"
                  value={scene.notes}
                  onChange={(value) => updateScene(index, "notes", value)}
                  rows={3}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addScene}
            className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-medium"
          >
            Thêm cảnh
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
          >
            Lưu timeline cảnh
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 outline-none transition focus:border-[var(--accent)]"
      />
    </div>
  );
}
