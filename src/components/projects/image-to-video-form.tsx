"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { Wand2 } from "lucide-react";
import type { ProjectAssetRecord } from "@/lib/projects/types";
import { startImageToVideoRenderAction } from "@/lib/render/actions";
import {
  buildImageToVideoPrompt,
  imageToVideoMotionLabels,
  IMAGE_TO_VIDEO_MOTION_STYLES,
  type ImageToVideoMotionStyle,
} from "@/lib/render/prompts";

const imageAssetTypes = new Set([
  "product_image",
  "start_image",
  "avatar_image",
  "background_image",
  "reference_image",
]);

export function ImageToVideoForm({
  projectId,
  assets,
}: {
  projectId: string;
  assets: ProjectAssetRecord[];
}) {
  const imageAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.mime_type.startsWith("image/") &&
          imageAssetTypes.has(asset.asset_type),
      ),
    [assets],
  );
  const [assetId, setAssetId] = useState(imageAssets[0]?.id ?? "");
  const [motionStyle, setMotionStyle] =
    useState<ImageToVideoMotionStyle>("product_reveal");
  const [durationSeconds, setDurationSeconds] = useState("6");
  const [direction, setDirection] = useState("");
  const [prompt, setPrompt] = useState(
    buildImageToVideoPrompt({ motionStyle: "product_reveal" }),
  );
  const selectedAsset = imageAssets.find((asset) => asset.id === assetId);

  const regeneratePrompt = (nextMotionStyle = motionStyle) => {
    setPrompt(
      buildImageToVideoPrompt({
        motionStyle: nextMotionStyle,
        optionalPrompt: direction,
      }),
    );
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
          <Wand2 className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium">Image-to-video</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Chọn ảnh đã tải lên, tạo prompt chuyển động có thể chỉnh sửa, rồi
            render qua pipeline provider ở backend.
          </p>
        </div>
      </div>

      {imageAssets.length > 0 ? (
        <form action={startImageToVideoRenderAction} className="mt-5 space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Ảnh đã tải lên</label>
                <select
                  name="assetId"
                  value={assetId}
                  onChange={(event) => setAssetId(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                >
                  {imageAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.file_name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAsset?.file_url ? (
                <img
                  src={selectedAsset.file_url}
                  alt={selectedAsset.file_name}
                  className="h-56 w-full rounded-2xl border border-[var(--border)] object-cover"
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Phong cách chuyển động</label>
                  <select
                    name="motionStyle"
                    value={motionStyle}
                    onChange={(event) => {
                      const next = event.target.value as ImageToVideoMotionStyle;
                      setMotionStyle(next);
                      setPrompt(
                        buildImageToVideoPrompt({
                          motionStyle: next,
                          optionalPrompt: direction,
                        }),
                      );
                    }}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                  >
                    {IMAGE_TO_VIDEO_MOTION_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {imageToVideoMotionLabels[style]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Thời lượng</label>
                  <select
                    name="durationSeconds"
                    value={durationSeconds}
                    onChange={(event) => setDurationSeconds(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                  >
                    <option value="4">4 giây</option>
                    <option value="6">6 giây</option>
                    <option value="8">8 giây</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Định hướng bổ sung</label>
                <textarea
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  rows={3}
                  placeholder="Thêm chi tiết sản phẩm, mood mong muốn, ghi chú camera..."
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => regeneratePrompt()}
                className="rounded-2xl border border-[var(--border)] px-4 py-2 text-sm"
              >
                Tạo prompt
              </button>

              <div>
                <label className="mb-2 block text-sm font-medium">Prompt có thể chỉnh sửa</label>
                <textarea
                  name="prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 font-mono text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!assetId || !prompt.trim()}
                className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] disabled:opacity-50"
              >
                Render video từ ảnh
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
          Hãy tải ảnh trong tab Tài sản trước khi dùng image-to-video.
        </div>
      )}
    </div>
  );
}
