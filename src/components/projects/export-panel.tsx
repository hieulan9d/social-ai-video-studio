"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Download, Film, Music, Stamp } from "lucide-react";
import { startVideoExportAction } from "@/lib/exports/actions";
import type {
  ExportJobRecord,
  GeneratedVideoRecord,
  ProjectAssetRecord,
} from "@/lib/projects/types";

const exportRatios = ["9:16", "1:1", "16:9"] as const;

export function ExportPanel({
  projectId,
  assets,
  generatedVideos,
  exportJobs,
}: {
  projectId: string;
  assets: ProjectAssetRecord[];
  generatedVideos: GeneratedVideoRecord[];
  exportJobs: ExportJobRecord[];
}) {
  const sourceClips = useMemo(
    () =>
      generatedVideos.filter(
        (video) =>
          video.storage_path &&
          video.status === "ready" &&
          typeof video.metadata.export_job_id === "undefined",
      ),
    [generatedVideos],
  );
  const [orderedClipIds, setOrderedClipIds] = useState(
    sourceClips.map((clip) => clip.id),
  );
  const selectedClips = orderedClipIds
    .map((id) => sourceClips.find((clip) => clip.id === id))
    .filter((clip): clip is GeneratedVideoRecord => Boolean(clip));
  const audioAssets = assets.filter((asset) => asset.mime_type.startsWith("audio/"));
  const logoAssets = assets.filter(
    (asset) => asset.asset_type === "logo" && asset.mime_type.startsWith("image/"),
  );

  const moveClip = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= orderedClipIds.length) {
      return;
    }

    setOrderedClipIds((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bộ máy export video</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Sắp xếp lại clip đã tạo, thêm phụ đề, âm thanh và watermark/logo, sau
          đó export video cuối có thể tải xuống bằng FFmpeg ở backend.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
            <Film className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">Tạo bản export cuối</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Job export được đưa vào hàng đợi, trừ tín dụng trước và hoàn lại
              nếu xử lý FFmpeg thất bại.
            </p>
          </div>
        </div>

        {sourceClips.length > 0 ? (
          <form action={startVideoExportAction} className="mt-5 space-y-5">
            <input type="hidden" name="projectId" value={projectId} />
            {selectedClips.map((clip) => (
              <input key={clip.id} type="hidden" name="videoIds" value={clip.id} />
            ))}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Thứ tự clip
              </label>
              <div className="space-y-3">
                {selectedClips.map((clip, index) => (
                  <div
                    key={clip.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 lg:flex-row lg:items-center"
                  >
                    {clip.file_url ? (
                      <video
                        controls
                        src={clip.file_url}
                        className="aspect-video w-full rounded-xl border border-[var(--border)] bg-black lg:w-48"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Clip {index + 1}</p>
                      <p className="mt-1 break-all text-xs text-[var(--muted-foreground)]">
                        {clip.storage_path}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => moveClip(index, -1)}
                        disabled={index === 0}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] disabled:opacity-40"
                        aria-label="Chuyển clip lên"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveClip(index, 1)}
                        disabled={index === selectedClips.length - 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] disabled:opacity-40"
                        aria-label="Chuyển clip xuống"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Tỷ lệ export
                </label>
                <select
                  name="exportRatio"
                  defaultValue="9:16"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                >
                  {exportRatios.map((ratio) => (
                    <option key={ratio} value={ratio}>
                      {ratio}
                    </option>
                  ))}
                </select>
              </div>

              <AssetSelect
                label="Voiceover"
                name="voiceoverAssetId"
                assets={audioAssets}
                icon={<Music className="h-4 w-4" />}
              />
              <AssetSelect
                label="Nhạc nền"
                name="musicAssetId"
                assets={audioAssets}
                icon={<Music className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
              <AssetSelect
                label="Watermark/logo"
                name="logoAssetId"
                assets={logoAssets}
                icon={<Stamp className="h-4 w-4" />}
              />
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Phụ đề
                </label>
                <textarea
                  name="subtitles"
                  rows={4}
                  placeholder="Phụ đề tùy chọn sẽ được chèn trực tiếp vào video cuối."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedClips.length === 0}
              className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] disabled:opacity-50"
            >
              Export video cuối
            </button>
          </form>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
            Hãy hoàn tất ít nhất một job render trước khi export video cuối.
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Hàng đợi export</h3>
        <div className="mt-4 space-y-4">
          {exportJobs.length > 0 ? (
            exportJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getStatusClass(job.status)}>
                        {formatExportStatus(job.status)}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {job.export_ratio}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {job.input_video_ids.length} clip
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {job.credit_cost} tín dụng
                      </span>
                    </div>
                    {job.error_message ? (
                      <p className="mt-3 text-sm text-rose-300">
                        {job.error_message}
                      </p>
                    ) : null}
                    {job.file_url ? (
                      <video
                        controls
                        src={job.file_url}
                        className="mt-4 aspect-video w-full max-w-xl rounded-2xl border border-[var(--border)] bg-black"
                      />
                    ) : null}
                  </div>

                  {job.file_url ? (
                    <a
                      href={job.file_url}
                      download
                      className="inline-flex items-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)]"
                    >
                      <Download className="h-4 w-4" />
                      Tải xuống
                    </a>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
              Chưa có job export nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AssetSelect({
  label,
  name,
  assets,
  icon,
}: {
  label: string;
  name: string;
  assets: ProjectAssetRecord[];
  icon: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </label>
      <select
        name={name}
        defaultValue=""
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
      >
        <option value="">Không chọn</option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.file_name}
          </option>
        ))}
      </select>
    </div>
  );
}

function getStatusClass(status: ExportJobRecord["status"]) {
  const base = "rounded-full px-3 py-1 text-xs font-medium capitalize";

  if (status === "completed") {
    return `${base} bg-emerald-500/10 text-emerald-300`;
  }

  if (status === "failed") {
    return `${base} bg-rose-500/10 text-rose-300`;
  }

  if (status === "processing") {
    return `${base} bg-sky-500/10 text-sky-300`;
  }

  return `${base} bg-amber-500/10 text-amber-200`;
}

function formatExportStatus(status: ExportJobRecord["status"]) {
  const labels: Record<ExportJobRecord["status"], string> = {
    queued: "Đang chờ",
    processing: "Đang xử lý",
    completed: "Đã hoàn tất",
    failed: "Thất bại",
  };

  return labels[status];
}
