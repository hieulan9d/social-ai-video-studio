"use client";

import { useCallback, useEffect, useState } from "react";
import type { CampaignAssetRecord } from "@/modules/ai-kol-system";

type Props = {
  campaignId: string;
  kolId: string;
  kolAvatarUrl: string | null;
};

export function CampaignStudio({ campaignId, kolId, kolAvatarUrl }: Props) {
  const [assets, setAssets] = useState<CampaignAssetRecord[]>([]);
  const [variantUrls, setVariantUrls] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [variantPrompt, setVariantPrompt] = useState("");
  const [refSheetUrl, setRefSheetUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingVariant, setGeneratingVariant] = useState(false);
  const [generatingSheet, setGeneratingSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/kol-admin/campaign/assets?campaignId=${campaignId}`);
      const data = await res.json();
      if (res.ok) setAssets(data.assets || []);
    } catch { /* ignore */ }
  }, [campaignId]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  // ── Upload product/reference image ──────────────────────

  const handleUpload = async (file: File, assetType: string) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("campaignId", campaignId);
      formData.append("kolId", kolId);
      formData.append("assetType", assetType);
      formData.append("name", file.name);
      formData.append("file", file);

      const res = await fetch("/api/kol-admin/campaign/assets", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAssets((prev) => [data.asset, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  // ── Delete asset ─────────────────────────────────────────

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Xóa ảnh này?")) return;
    try {
      const res = await fetch(`/api/kol-admin/campaign/assets/${assetId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
      if (selectedVariant) {
        const deleted = assets.find((a) => a.id === assetId);
        if (deleted?.file_url === selectedVariant) setSelectedVariant(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Generate product reference sheet ────────────────────

  const [generatingProductSheet, setGeneratingProductSheet] = useState(false);

  const handleGenerateProductSheet = async (productImageUrl: string) => {
    setGeneratingProductSheet(true);
    setError(null);
    try {
      const res = await fetch("/api/kol-admin/campaign/generate-product-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, kolId, productImageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingProductSheet(false);
    }
  };

  // ── Generate KOL variant ────────────────────────────────

  const handleGenerateVariant = async () => {
    if (!variantPrompt.trim()) {
      setError("Nhập mô tả thay đổi cho KOL");
      return;
    }
    setGeneratingVariant(true);
    setError(null);
    try {
      // Collect product image URLs as additional references
      const productRefs = assets
        .filter((a) => a.asset_type === "product_image" && a.file_url)
        .map((a) => a.file_url as string);

      const res = await fetch("/api/kol-admin/campaign/generate-variant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          kolId,
          prompt: variantPrompt.trim(),
          referenceImageUrls: productRefs,
          candidateCount: 2,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVariantUrls(data.outputUrls || []);
      if (data.outputUrls?.length > 0) {
        setSelectedVariant(data.outputUrls[0]);
      }
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingVariant(false);
    }
  };

  // ── Generate reference sheet ────────────────────────────

  const handleGenerateRefSheet = async () => {
    const sourceImage = selectedVariant || kolAvatarUrl;
    if (!sourceImage) {
      setError("Chưa có ảnh KOL. Hãy generate variant hoặc finalize avatar trước.");
      return;
    }
    setGeneratingSheet(true);
    setError(null);
    try {
      const res = await fetch("/api/kol-admin/campaign/generate-reference-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          kolId,
          variantImageUrl: sourceImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRefSheetUrl(data.referenceSheetUrl);
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingSheet(false);
    }
  };

  // ── Render ──────────────────────────────────────────────

  const productImages = assets.filter((a) => a.asset_type === "product_image");
  const referenceImages = assets.filter((a) => a.asset_type === "reference_image");

  return (
    <div className="space-y-4">
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-sm">
          <pre className="text-red-400 whitespace-pre-wrap font-sans">{error}</pre>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: Assets */}
        <div className="col-span-4 space-y-4">
          {/* Product images */}
          <div className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-sm">📦 Ảnh sản phẩm ({productImages.length})</div>
            <label className="block border-2 border-dashed border-white/10 rounded p-3 text-center text-xs cursor-pointer hover:border-white/30">
              {uploading ? "Uploading..." : "Drop hoặc click để upload ảnh sản phẩm"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach((f) => handleUpload(f, "product_image"));
                  e.target.value = "";
                }}
              />
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {productImages.map((a) => (
                <div
                  key={a.id}
                  className={`relative group cursor-pointer rounded overflow-hidden ${
                    selectedVariant === a.file_url ? "ring-2 ring-blue-400" : ""
                  }`}
                  onClick={() => a.file_url && setSelectedVariant(a.file_url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.file_url || ""}
                    alt={a.name}
                    className="aspect-square object-cover rounded"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center py-0.5 truncate px-1">
                    {a.name}
                  </div>
                  {/* Delete + Generate buttons */}
                  <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => a.file_url && handleGenerateProductSheet(a.file_url)}
                      disabled={generatingProductSheet}
                      className="w-5 h-5 bg-green-600 rounded text-[8px] flex items-center justify-center"
                      title="Tạo ảnh sản phẩm 8 góc"
                    >
                      📐
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(a.id)}
                      className="w-5 h-5 bg-red-600 rounded text-[8px] flex items-center justify-center"
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {productImages.length > 0 && (
              <button
                onClick={() => {
                  const first = productImages.find((a) => a.file_url);
                  if (first?.file_url) handleGenerateProductSheet(first.file_url);
                }}
                disabled={generatingProductSheet}
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs font-medium"
              >
                {generatingProductSheet ? "Đang tạo..." : "📐 Tạo ảnh sản phẩm 8 góc"}
              </button>
            )}
          </div>

          {/* KOL Avatar */}
          <div className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-sm">👤 KOL Avatar gốc</div>
            {kolAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kolAvatarUrl} alt="KOL" className="w-full aspect-square object-cover rounded" />
            ) : (
              <div className="aspect-square bg-white/5 rounded flex items-center justify-center text-xs text-gray-500">
                Chưa có avatar. Vào Avatar Studio để tạo.
              </div>
            )}
          </div>

          {/* Generated variants */}
          {referenceImages.length > 0 && (
            <div className="border border-white/10 rounded-lg p-3 space-y-2">
              <div className="font-semibold text-sm">🎨 Ảnh đã tạo ({referenceImages.length})</div>
              <div className="grid grid-cols-2 gap-1.5">
                {referenceImages.map((a) => (
                  <div
                    key={a.id}
                    className={`relative cursor-pointer rounded overflow-hidden group ${
                      selectedVariant === a.file_url ? "ring-2 ring-blue-400" : ""
                    }`}
                    onClick={() => a.file_url && setSelectedVariant(a.file_url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.file_url || ""} alt={a.name} className="aspect-square object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteAsset(a.id); }}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-600 rounded text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa"
                    >
                      ✕
                    </button>
                    {a.name && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center py-0.5 truncate px-1">
                        {a.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Preview */}
        <div className="col-span-4 space-y-3">
          <div className="border border-white/10 rounded-lg p-3">
            <div className="font-semibold text-sm mb-2">Xem trước</div>
            <div className="aspect-square bg-black/40 border border-white/10 rounded flex items-center justify-center overflow-hidden">
              {selectedVariant ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedVariant} alt="Selected" className="w-full h-full object-contain" />
              ) : kolAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kolAvatarUrl} alt="KOL" className="w-full h-full object-contain" />
              ) : (
                <div className="text-gray-500 text-xs text-center p-4">
                  Upload ảnh sản phẩm và tạo ảnh KOL để xem trước
                </div>
              )}
            </div>
            {variantUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {variantUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`Variant ${i + 1}`}
                    className={`aspect-square object-cover rounded cursor-pointer ${
                      selectedVariant === url ? "ring-2 ring-blue-400" : "opacity-70 hover:opacity-100"
                    }`}
                    onClick={() => setSelectedVariant(url)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Reference sheet result */}
          {refSheetUrl && (
            <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-3">
              <div className="font-semibold text-sm mb-2 text-green-400">✅ Reference Sheet</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refSheetUrl} alt="Reference Sheet" className="w-full rounded" />
            </div>
          )}
        </div>

        {/* RIGHT: Controls */}
        <div className="col-span-4 space-y-3">
          {/* Variant generator */}
          <div className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-sm">🎨 Tạo ảnh KOL cho campaign</div>
            <div className="text-xs text-gray-400">
              Thay đổi trang phục, kiểu tóc, background, thêm sản phẩm...
              <br />Identity KOL sẽ được giữ nguyên.
            </div>

            {/* Reference images for variant generation */}
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">Ảnh tham chiếu cho variant (outfit, style...)</label>
              <label className="block border border-dashed border-white/20 rounded p-2 text-center text-[10px] cursor-pointer hover:border-white/40">
                {uploading ? "Uploading..." : "+ Upload ảnh tham chiếu"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    Array.from(e.target.files || []).forEach((f) => handleUpload(f, "reference_image"));
                    e.target.value = "";
                  }}
                />
              </label>
              {referenceImages.length > 0 && (
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  {referenceImages.slice(0, 8).map((a) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={a.id} src={a.file_url || ""} alt="" className="aspect-square object-cover rounded" />
                  ))}
                </div>
              )}
            </div>

            <textarea
              value={variantPrompt}
              onChange={(e) => setVariantPrompt(e.target.value)}
              rows={4}
              placeholder={'e.g. "Mặc áo dài trắng, cầm sản phẩm nước rửa chén, background bếp hiện đại, tóc búi cao"'}
              className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-xs"
              disabled={generatingVariant}
            />
            <button
              onClick={handleGenerateVariant}
              disabled={generatingVariant || !variantPrompt.trim()}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm font-medium"
            >
              {generatingVariant ? "Đang tạo..." : "⚡ Tạo ảnh KOL"}
            </button>
          </div>

          {/* Reference sheet generator */}
          <div className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-sm">📐 Tạo ảnh tham chiếu nhiều góc</div>
            <div className="text-xs text-gray-400">
              Tạo reference sheet 8 góc (front, side, back, close-up) từ ảnh KOL đã chọn.
              <br />Dùng cho video generation consistency.
            </div>
            <button
              onClick={handleGenerateRefSheet}
              disabled={generatingSheet || (!selectedVariant && !kolAvatarUrl)}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm font-medium"
            >
              {generatingSheet ? "Đang tạo reference sheet..." : "📐 Tạo ảnh tham chiếu 8 góc"}
            </button>
            <div className="text-[10px] text-gray-500">
              Sử dụng: {selectedVariant ? "Variant đã chọn" : kolAvatarUrl ? "Avatar gốc" : "Chưa có ảnh"}
            </div>
          </div>

          {/* Upload additional reference */}
          <div className="border border-white/10 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-sm">📎 Upload thêm ảnh tham chiếu</div>
            <label className="block border-2 border-dashed border-white/10 rounded p-3 text-center text-xs cursor-pointer hover:border-white/30">
              {uploading ? "Uploading..." : "Drop hoặc click"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach((f) => handleUpload(f, "reference_image"));
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
