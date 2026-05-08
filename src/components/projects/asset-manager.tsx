"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { ImageIcon, Music, Trash2, Upload } from "lucide-react";
import type { ProjectAssetRecord } from "@/lib/projects/types";
import {
  ALLOWED_PROJECT_ASSET_MIME_TYPES,
  ALLOWED_PROJECT_AUDIO_MIME_TYPES,
  ALLOWED_PROJECT_IMAGE_MIME_TYPES,
  MAX_PROJECT_AUDIO_ASSET_SIZE_BYTES,
  MAX_PROJECT_IMAGE_ASSET_SIZE_BYTES,
} from "@/lib/assets/validation";
import {
  PROJECT_ASSET_TYPES,
  type ProjectAssetType,
} from "@/lib/assets/types";

const assetLabels: Record<ProjectAssetType, string> = {
  product_image: "Ảnh sản phẩm",
  start_image: "Ảnh bắt đầu",
  end_image: "Ảnh kết thúc",
  avatar_image: "Ảnh avatar",
  logo: "Logo",
  background_image: "Ảnh nền",
  voiceover_audio: "Âm thanh voiceover",
  music_audio: "Nhạc nền",
};

type UploadDraft = {
  file: File;
  previewUrl: string;
};

type ApiAssetResponse = {
  ok: boolean;
  asset?: ProjectAssetRecord;
  error?: string;
};

export function AssetManager({
  projectId,
  initialAssets,
  onAssetsChange,
}: {
  projectId: string;
  initialAssets: ProjectAssetRecord[];
  onAssetsChange?: (assets: ProjectAssetRecord[]) => void;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [drafts, setDrafts] = useState<Partial<Record<ProjectAssetType, UploadDraft>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busyAssetType, setBusyAssetType] = useState<ProjectAssetType | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  const groupedAssets = useMemo(
    () =>
      PROJECT_ASSET_TYPES.reduce(
        (groups, type) => ({
          ...groups,
          [type]: assets.filter((asset) => asset.asset_type === type),
        }),
        {} as Record<ProjectAssetType, ProjectAssetRecord[]>,
      ),
    [assets],
  );

  const setDraft = (assetType: ProjectAssetType, file: File | null) => {
    const currentDraft = drafts[assetType];

    if (currentDraft) {
      URL.revokeObjectURL(currentDraft.previewUrl);
    }

    if (!file) {
      setDrafts((current) => ({
        ...current,
        [assetType]: undefined,
      }));
      return;
    }

    const validationError = validateClientFile(file);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setMessage(null);
    setDrafts((current) => ({
      ...current,
      [assetType]: {
        file,
        previewUrl: URL.createObjectURL(file),
      },
    }));
  };

  const uploadDraft = async (assetType: ProjectAssetType) => {
    const draft = drafts[assetType];

    if (!draft) {
      setMessage("Hãy chọn file trước khi tải lên.");
      return;
    }

    setBusyAssetType(assetType);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("assetType", assetType);
      formData.set("file", draft.file);

      const response = await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ApiAssetResponse;

      if (!response.ok || !payload.ok || !payload.asset) {
        throw new Error(payload.error || "Tải lên thất bại.");
      }

      URL.revokeObjectURL(draft.previewUrl);
      setAssets((current) => {
        const nextAssets = [payload.asset as ProjectAssetRecord, ...current];
        onAssetsChange?.(nextAssets);
        return nextAssets;
      });
      setDrafts((current) => ({
        ...current,
        [assetType]: undefined,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Tải lên thất bại.");
    } finally {
      setBusyAssetType(null);
    }
  };

  const deleteAsset = async (assetId: string) => {
    setDeletingAssetId(assetId);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/assets/${assetId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Xóa thất bại.");
      }

      setAssets((current) => {
        const nextAssets = current.filter((asset) => asset.id !== assetId);
        onAssetsChange?.(nextAssets);
        return nextAssets;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa thất bại.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tài sản dự án</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Tải lên hình ảnh và âm thanh riêng của dự án để giữ nhất quán sản phẩm,
          nhân vật, ảnh chuyển cảnh, logo và bối cảnh nền.
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {PROJECT_ASSET_TYPES.map((assetType) => {
          const draft = drafts[assetType];
          const currentAssets = groupedAssets[assetType];
          const isAudioAsset = assetType.endsWith("_audio");
          const acceptTypes = isAudioAsset
            ? ALLOWED_PROJECT_AUDIO_MIME_TYPES
            : ALLOWED_PROJECT_IMAGE_MIME_TYPES;
          const AssetIcon = isAudioAsset ? Music : ImageIcon;

          return (
            <section
              key={assetType}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{assetLabels[assetType]}</h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {isAudioAsset
                      ? "Âm thanh MP3, MP4, AAC, WAV hoặc WebM. Tối đa 50MB."
                      : "Ảnh JPEG, PNG, WebP hoặc GIF. Tối đa 10MB."}
                  </p>
                </div>
                <AssetIcon className="h-5 w-5 text-[var(--muted-foreground)]" />
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <input
                  type="file"
                  accept={acceptTypes.join(",")}
                  onChange={(event) =>
                    setDraft(assetType, event.target.files?.[0] ?? null)
                  }
                  className="block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--foreground)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--background)]"
                />

                {draft ? (
                  <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                    {isAudioAsset ? (
                      <div className="flex h-24 items-center justify-center bg-[var(--background)] px-4">
                        <audio controls src={draft.previewUrl} className="w-full" />
                      </div>
                    ) : (
                      <img
                        src={draft.previewUrl}
                        alt={`Xem trước ${assetLabels[assetType]}`}
                        className="h-44 w-full object-cover"
                      />
                    )}
                    <div className="flex items-center justify-between gap-3 px-3 py-3 text-xs text-[var(--muted-foreground)]">
                      <span className="truncate">{draft.file.name}</span>
                      <span>{formatFileSize(draft.file.size)}</span>
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => uploadDraft(assetType)}
                  disabled={!draft || busyAssetType === assetType}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-4 py-3 text-sm font-medium text-[var(--background)] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {busyAssetType === assetType ? "Đang tải lên..." : "Tải tài sản lên"}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {currentAssets.length > 0 ? (
                  currentAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3"
                    >
                      {asset.file_url ? (
                        asset.mime_type.startsWith("audio/") ? (
                          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[var(--border)]">
                            <Music className="h-5 w-5 text-[var(--muted-foreground)]" />
                          </div>
                        ) : (
                          <img
                            src={asset.file_url}
                            alt={asset.file_name}
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                        )
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-[var(--border)]">
                          <ImageIcon className="h-5 w-5 text-[var(--muted-foreground)]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{asset.file_name}</p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {asset.mime_type} / {formatFileSize(asset.file_size)}
                        </p>
                        <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                          {asset.storage_path}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteAsset(asset.id)}
                        disabled={deletingAssetId === asset.id}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-500/30 text-rose-300 disabled:opacity-50"
                        aria-label={`Xóa ${asset.file_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    Chưa tải lên {assetLabels[assetType].toLowerCase()}.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function validateClientFile(file: File) {
  if (
    ALLOWED_PROJECT_IMAGE_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PROJECT_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return file.size > MAX_PROJECT_IMAGE_ASSET_SIZE_BYTES
      ? "Ảnh tải lên phải có dung lượng từ 10MB trở xuống."
      : null;
  }

  if (
    ALLOWED_PROJECT_AUDIO_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PROJECT_AUDIO_MIME_TYPES)[number],
    )
  ) {
    return file.size > MAX_PROJECT_AUDIO_ASSET_SIZE_BYTES
      ? "Âm thanh tải lên phải có dung lượng từ 50MB trở xuống."
      : null;
  }

  if (
    !ALLOWED_PROJECT_ASSET_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PROJECT_ASSET_MIME_TYPES)[number],
    )
  ) {
    return "File tải lên phải là ảnh hoặc định dạng âm thanh được hỗ trợ.";
  }

  return null;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}
