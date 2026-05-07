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
  product_image: "Product image",
  start_image: "Start image",
  end_image: "End image",
  avatar_image: "Avatar image",
  logo: "Logo",
  background_image: "Background image",
  voiceover_audio: "Voiceover audio",
  music_audio: "Music audio",
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
}: {
  projectId: string;
  initialAssets: ProjectAssetRecord[];
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
      setMessage("Choose a file before uploading.");
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
        throw new Error(payload.error || "Upload failed.");
      }

      URL.revokeObjectURL(draft.previewUrl);
      setAssets((current) => [payload.asset as ProjectAssetRecord, ...current]);
      setDrafts((current) => ({
        ...current,
        [assetType]: undefined,
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
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
        throw new Error(payload.error || "Delete failed.");
      }

      setAssets((current) => current.filter((asset) => asset.id !== assetId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeletingAssetId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Project Assets</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          Upload private project images for product consistency, character
          references, start/end transitions, logos, and background scenes.
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
                      ? "MP3, MP4, AAC, WAV, or WebM audio. Max 50MB."
                      : "JPEG, PNG, WebP, or GIF. Max 10MB."}
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
                        alt={`${assetLabels[assetType]} preview`}
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
                  {busyAssetType === assetType ? "Uploading..." : "Upload asset"}
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
                        aria-label={`Delete ${asset.file_name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
                    No {assetLabels[assetType].toLowerCase()} uploaded yet.
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
      ? "Uploaded image must be 10MB or smaller."
      : null;
  }

  if (
    ALLOWED_PROJECT_AUDIO_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PROJECT_AUDIO_MIME_TYPES)[number],
    )
  ) {
    return file.size > MAX_PROJECT_AUDIO_ASSET_SIZE_BYTES
      ? "Uploaded audio must be 50MB or smaller."
      : null;
  }

  if (
    !ALLOWED_PROJECT_ASSET_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_PROJECT_ASSET_MIME_TYPES)[number],
    )
  ) {
    return "Uploaded file must be an image or supported audio file.";
  }

  return null;
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}
