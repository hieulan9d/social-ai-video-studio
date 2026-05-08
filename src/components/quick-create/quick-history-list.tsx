"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Download, Save, Trash2 } from "lucide-react";
import type { QuickGenerationRecord } from "@/lib/ai/quick-generations";
import type { Project } from "@/lib/projects/types";

const actionClass =
  "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]";

function readGeneratedText(metadata: Record<string, unknown>) {
  return typeof metadata.generated_text === "string" ? metadata.generated_text : "";
}

export function QuickHistoryList({
  initialGenerations,
  projects,
}: {
  initialGenerations: QuickGenerationRecord[];
  projects: Project[];
}) {
  const [generations, setGenerations] = useState(initialGenerations);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteItem(id: string) {
    const response = await fetch(`/api/quick-generations/${id}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Không thể xóa lịch sử.");
      return;
    }

    setGenerations((current) => current.filter((item) => item.id !== id));
    setMessage("Đã xóa lịch sử.");
  }

  async function saveToProject(id: string) {
    if (!projectId) {
      setError("Vui lòng chọn dự án.");
      return;
    }

    const response = await fetch(`/api/quick-generations/${id}/save-to-project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? "Không thể lưu vào dự án.");
      return;
    }

    setMessage("Đã lưu output vào dự án.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lịch sử tạo nhanh</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Xem lại prompt, ảnh và video đã tạo nhanh.
            </p>
          </div>
          {projects.length > 0 ? (
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <Status message={message} error={error} />
      </div>

      {generations.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--muted-foreground)]">
          Chưa có lịch sử tạo nhanh.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {generations.map((item) => (
            <article
              key={item.id}
              className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              {item.type === "image" && item.output_url ? (
                <Image
                  src={item.output_url}
                  alt={item.prompt}
                  width={960}
                  height={540}
                  unoptimized
                  loading="lazy"
                  className="aspect-video w-full rounded-2xl object-cover"
                />
              ) : null}

              {item.type === "video" && item.output_url ? (
                <video
                  src={item.output_url}
                  controls
                  className="aspect-video w-full rounded-2xl bg-black"
                />
              ) : null}

              {item.type === "prompt" ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Prompt output
                  </p>
                  <pre className="mt-3 line-clamp-8 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">
                    {readGeneratedText(item.metadata)}
                  </pre>
                </div>
              ) : null}

              <div className="mt-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  {item.type === "image"
                    ? "Image"
                    : item.type === "video"
                      ? "Video"
                      : "Prompt"}{" "}
                  / {item.model}
                </p>
                <p className="line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.prompt}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {new Date(item.created_at).toLocaleString("vi-VN")}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.output_url ? (
                  <a href={item.output_url} download className={actionClass}>
                    <Download className="h-4 w-4" />
                    Tải lại
                  </a>
                ) : null}

                {item.type === "prompt" ? (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(readGeneratedText(item.metadata))}
                    className={actionClass}
                  >
                    <Copy className="h-4 w-4" />
                    Copy output
                  </button>
                ) : (
                  <button type="button" onClick={() => saveToProject(item.id)} className={actionClass}>
                    <Save className="h-4 w-4" />
                    Lưu vào dự án
                  </button>
                )}

                <button type="button" onClick={() => deleteItem(item.id)} className={actionClass}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Status({ message, error }: { message: string | null; error: string | null }) {
  if (!message && !error) {
    return null;
  }

  return (
    <div
      className={[
        "mt-4 rounded-2xl border px-4 py-3 text-sm",
        error
          ? "border-red-500/30 bg-red-500/10 text-red-600"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
      ].join(" ")}
    >
      {error ?? message}
    </div>
  );
}
