"use client";

import { createContext, useContext, useState } from "react";
import Image from "next/image";
import { Download, Layers3, X, ZoomIn, ZoomOut } from "lucide-react";
import type { ProjectAssetRecord } from "@/lib/projects/types";

type PreviewItem = {
  type: "image" | "video";
  url: string;
  alt: string;
};

type PreviewContextType = {
  onAssetClick: (asset: ProjectAssetRecord) => void;
};

const ProjectPreviewContext = createContext<PreviewContextType>({
  onAssetClick: () => {},
});

export function usePreviewCanvas() {
  return useContext(ProjectPreviewContext);
}

export function ProjectPreviewCanvas({
  assets,
  initialPreview,
  children,
}: {
  assets: ProjectAssetRecord[];
  initialPreview: PreviewItem | null;
  children?: React.ReactNode;
}) {
  const [preview, setPreview] = useState<PreviewItem | null>(initialPreview);
  const [zoom, setZoom] = useState(1);

  const handleAssetClick = (asset: ProjectAssetRecord) => {
    const url = asset.file_url ?? asset.output_url ?? "";
    if (!url) return;
    const isVideo = asset.asset_type === "generated_video" || asset.type === "video";
    setPreview({ type: isVideo ? "video" : "image", url, alt: asset.prompt ?? asset.file_name });
    setZoom(1);
  };

  const handleDownload = () => {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview.url;
    link.download = preview.alt || "download";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProjectPreviewContext.Provider value={{ onAssetClick: handleAssetClick }}>
      <div className="rounded-[var(--radius-shell)] border border-[var(--border)] bg-[var(--surface-elevated)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-medium text-[var(--heading)]">Preview canvas</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {preview ? "Click ảnh/video bên dưới để thay đổi preview" : "Chọn asset để xem trong canvas"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {preview && (
              <>
                <button type="button" onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setZoom(1)} className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                  {Math.round(zoom * 100)}%
                </button>
                <button type="button" onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleDownload} className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
                <button type="button" onClick={() => setPreview(null)} className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-5 overflow-hidden rounded-[12px] border bg-[var(--surface-muted)]">
          {preview ? (
            <div className="flex aspect-video items-center justify-center overflow-auto bg-black/40">
              {preview.type === "video" ? (
                <video src={preview.url} controls className="max-h-full max-w-full" style={{ transform: `scale(${zoom})` }} />
              ) : (
                <Image src={preview.url} alt={preview.alt} width={1400} height={900} unoptimized className="max-h-full max-w-full object-contain transition-transform" style={{ transform: `scale(${zoom})` }} />
              )}
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-[var(--muted-foreground)]">
              <div>
                <Layers3 className="mx-auto h-8 w-8 text-[var(--muted)]" />
                <p className="mt-3">Click vào ảnh hoặc video bên dưới để xem preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {children}
    </ProjectPreviewContext.Provider>
  );
}

export function ClickableAssetGrid({ title, assets }: { title: string; assets: ProjectAssetRecord[] }) {
  const { onAssetClick } = usePreviewCanvas();
  return (
    <section className="rounded-[12px] border bg-[var(--surface-muted)] p-5">
      <h2 className="text-lg font-medium text-[var(--heading)]">{title}</h2>
      {assets.length === 0 ? (
        <p className="mt-4 rounded-[12px] border border-dashed p-6 text-sm text-[var(--muted-foreground)]">Chưa có output nào trong nhóm này.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => {
            const url = asset.file_url ?? asset.output_url ?? "";
            const isVideo = asset.asset_type === "generated_video" || asset.type === "video";
            return (
              <button key={asset.id} type="button" onClick={() => onAssetClick(asset)} className="group rounded-[12px] border bg-[var(--surface)] p-2 text-left transition hover:border-[var(--accent)] hover:ring-1 hover:ring-[var(--accent)]">
                {isVideo ? (
                  <video src={url} className="aspect-video w-full rounded-[8px] bg-black object-cover" muted />
                ) : (
                  <Image src={url} alt={asset.prompt ?? asset.file_name} width={400} height={400} unoptimized loading="lazy" className="aspect-square w-full rounded-[8px] object-cover" />
                )}
                <p className="mt-2 line-clamp-2 text-xs text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]">{asset.prompt || asset.file_name}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
