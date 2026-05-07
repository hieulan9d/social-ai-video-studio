"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { MoveRight } from "lucide-react";
import type { ProjectAssetRecord } from "@/lib/projects/types";
import { startEndTransitionRenderAction } from "@/lib/render/actions";
import {
  buildStartEndTransitionPrompt,
  startEndTransitionLabels,
  START_END_TRANSITION_STYLES,
  type StartEndTransitionStyle,
} from "@/lib/render/prompts";

export function StartEndTransitionForm({
  projectId,
  assets,
}: {
  projectId: string;
  assets: ProjectAssetRecord[];
}) {
  const startImages = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.mime_type.startsWith("image/") &&
          asset.asset_type === "start_image",
      ),
    [assets],
  );
  const endImages = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.mime_type.startsWith("image/") &&
          asset.asset_type === "end_image",
      ),
    [assets],
  );
  const [startAssetId, setStartAssetId] = useState(startImages[0]?.id ?? "");
  const [endAssetId, setEndAssetId] = useState(endImages[0]?.id ?? "");
  const [transitionStyle, setTransitionStyle] =
    useState<StartEndTransitionStyle>("cinematic_morph");
  const [durationSeconds, setDurationSeconds] = useState("6");
  const [direction, setDirection] = useState("");
  const [prompt, setPrompt] = useState(
    buildStartEndTransitionPrompt({ transitionStyle: "cinematic_morph" }),
  );
  const selectedStartAsset = startImages.find(
    (asset) => asset.id === startAssetId,
  );
  const selectedEndAsset = endImages.find((asset) => asset.id === endAssetId);

  const regeneratePrompt = (nextTransitionStyle = transitionStyle) => {
    setPrompt(
      buildStartEndTransitionPrompt({
        transitionStyle: nextTransitionStyle,
        optionalPrompt: direction,
      }),
    );
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--background)]">
          <MoveRight className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium">Chuyển cảnh ảnh đầu-cuối</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Chọn ảnh bắt đầu và ảnh kết thúc, tạo prompt chuyển cảnh có thể chỉnh
            sửa, rồi render qua cùng hàng đợi backend.
          </p>
        </div>
      </div>

      {startImages.length > 0 && endImages.length > 0 ? (
        <form action={startEndTransitionRenderAction} className="mt-5 space-y-4">
          <input type="hidden" name="projectId" value={projectId} />

          <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Ảnh bắt đầu
                  </label>
                  <select
                    name="startAssetId"
                    value={startAssetId}
                    onChange={(event) => setStartAssetId(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                  >
                    {startImages.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.file_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Ảnh kết thúc
                  </label>
                  <select
                    name="endAssetId"
                    value={endAssetId}
                    onChange={(event) => setEndAssetId(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                  >
                    {endImages.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.file_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedStartAsset?.file_url ? (
                  <img
                    src={selectedStartAsset.file_url}
                    alt={selectedStartAsset.file_name}
                    className="h-44 w-full rounded-2xl border border-[var(--border)] object-cover"
                  />
                ) : null}
                {selectedEndAsset?.file_url ? (
                  <img
                    src={selectedEndAsset.file_url}
                    alt={selectedEndAsset.file_name}
                    className="h-44 w-full rounded-2xl border border-[var(--border)] object-cover"
                  />
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Kiểu chuyển cảnh
                  </label>
                  <select
                    name="transitionStyle"
                    value={transitionStyle}
                    onChange={(event) => {
                      const next = event.target.value as StartEndTransitionStyle;
                      setTransitionStyle(next);
                      setPrompt(
                        buildStartEndTransitionPrompt({
                          transitionStyle: next,
                          optionalPrompt: direction,
                        }),
                      );
                    }}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none"
                  >
                    {START_END_TRANSITION_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {startEndTransitionLabels[style]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Thời lượng
                  </label>
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
                <label className="mb-2 block text-sm font-medium">
                  Định hướng bổ sung
                </label>
                <textarea
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  rows={3}
                  placeholder="Thêm yêu cầu về tính liên tục sản phẩm, mood, nhịp chuyển, ghi chú camera..."
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
                <label className="mb-2 block text-sm font-medium">
                  Prompt chuyển cảnh có thể chỉnh sửa
                </label>
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
                disabled={
                  !startAssetId ||
                  !endAssetId ||
                  startAssetId === endAssetId ||
                  !prompt.trim()
                }
                className="rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] disabled:opacity-50"
              >
                Render chuyển cảnh
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--border)] px-4 py-4 text-sm text-[var(--muted-foreground)]">
          Hãy tải ít nhất một ảnh bắt đầu và một ảnh kết thúc trong tab Tài sản
          trước khi render chuyển cảnh.
        </div>
      )}
    </div>
  );
}
