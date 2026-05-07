"use client";

import { useMemo, useState } from "react";
import {
  generateAllPromptsAction,
  regeneratePromptAction,
  savePromptsAction,
} from "@/lib/prompts/actions";
import type { Project, ProjectAssetRecord, PromptRecord, SceneRecord, ScriptRecord } from "@/lib/projects/types";

type EditablePrompt = {
  sceneId: string | null;
  sceneNumber: number;
  promptType: string;
  content: string;
};

export function PromptEditor({
  project,
  script,
  scenes,
  prompts,
  assets,
}: {
  project: Project;
  script: ScriptRecord | null;
  scenes: SceneRecord[];
  prompts: PromptRecord[];
  assets: ProjectAssetRecord[];
}) {
  const [items, setItems] = useState<EditablePrompt[]>(
    scenes.map((scene) => {
      const existingPrompt =
        prompts.find((prompt) => prompt.scene_id === scene.id) || null;

      return {
        sceneId: scene.id,
        sceneNumber: scene.scene_order,
        promptType: existingPrompt?.prompt_type || "veo",
        content: existingPrompt?.content || "",
      };
    }),
  );

  const hasProductImage = useMemo(
    () => assets.some((asset) => asset.asset_type === "product_image" || asset.asset_type === "logo"),
    [assets],
  );

  const serializedPrompts = JSON.stringify(
    items.map((item) => ({
      sceneId: item.sceneId,
      promptType: item.promptType,
      content: item.content,
    })),
  );

  const updatePrompt = (sceneId: string | null, content: string) => {
    setItems((current) =>
      current.map((item) =>
        item.sceneId === sceneId ? { ...item, content } : item,
      ),
    );
  };

  const copyPrompt = async (content: string) => {
    await navigator.clipboard.writeText(content);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Veo Prompt Generator</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Generate one cinematic English prompt per scene for Google Veo. Scene
          data may be written in Vietnamese, but the final Veo prompt is always
          saved in English.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <form
          action={generateAllPromptsAction}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
        >
          <input type="hidden" name="projectId" value={project.id} />
          <p className="text-sm font-medium">Generate prompts for all scenes</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Input context: {project.platform} · {project.style || "Cinematic social ad"} ·{" "}
            {script?.product_type || "general product"}
          </p>
          <button
            type="submit"
            disabled={!script || scenes.length === 0}
            className="mt-4 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] disabled:opacity-50"
          >
            Generate all Veo prompts
          </button>
        </form>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
          <p className="text-sm font-medium">Consistency mode</p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {hasProductImage
              ? "Product consistency instructions will be enforced because a product image or logo asset exists."
              : "No product image detected. Generic product consistency instructions will still be added."}
          </p>
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Default negative instructions include: subtitles, watermark, distorted
            face, extra fingers, wrong product label, random text, logo changes.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.sceneId || item.sceneNumber}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-semibold">Scene {item.sceneNumber}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Prompt type: {item.promptType.toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={regeneratePromptAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="sceneId" value={item.sceneId || ""} />
                    <button
                      type="submit"
                      className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm"
                    >
                      Regenerate prompt
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => copyPrompt(item.content)}
                    className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm"
                  >
                    Copy prompt
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium">Prompt content</label>
                <textarea
                  value={item.content}
                  onChange={(event) => updatePrompt(item.sceneId, event.target.value)}
                  rows={9}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 font-mono text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
            No scenes available yet. Generate scenes first, then create Veo prompts.
          </div>
        )}
      </div>

      {items.length > 0 ? (
        <form action={savePromptsAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="prompts" value={serializedPrompts} />
          <button
            type="submit"
            className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)]"
          >
            Save prompt edits
          </button>
        </form>
      ) : null}
    </div>
  );
}
