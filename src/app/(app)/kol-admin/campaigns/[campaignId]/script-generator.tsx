"use client";

import { useState } from "react";
import type { CampaignScriptRecord, CampaignSceneRecord } from "@/modules/ai-kol-system";

type Props = {
  campaignId: string;
  kolId: string;
  platform: string;
  contentType: string;
  existingScript: CampaignScriptRecord | null;
  existingScenes: CampaignSceneRecord[];
  campaignAssets?: { id: string; file_url: string | null; name: string; asset_type: string }[];
};

export function ScriptGenerator({
  campaignId,
  kolId,
  platform,
  contentType,
  existingScript,
  existingScenes,
  campaignAssets = [],
}: Props) {
  const [idea, setIdea] = useState("");
  const [product, setProduct] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [emotionStyle, setEmotionStyle] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [hookStyle, setHookStyle] = useState("curiosity");
  const [ctaGoal, setCta] = useState("engagement");
  const [language, setLanguage] = useState("vi");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<CampaignScriptRecord | null>(existingScript);
  const [scenes, setScenes] = useState<CampaignSceneRecord[]>(existingScenes);

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError("Nhập ý tưởng video");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/kol-admin/campaign/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          kolId,
          idea: idea.trim(),
          product: product.trim(),
          targetAudience: targetAudience.trim(),
          emotionStyle: emotionStyle.trim(),
          sceneDescription: sceneDescription.trim(),
          platform,
          contentType,
          duration,
          hookStyle,
          ctaGoal,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setScript(data.script);
      setScenes(data.scenes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Input form */}
      <div className="border border-white/10 rounded-lg p-4 space-y-4">
        <h2 className="font-semibold">🎬 Tạo kịch bản AI</h2>
        <p className="text-xs text-gray-400">
          Mô tả chi tiết giúp AI tạo kịch bản chính xác hơn. Kịch bản sẽ được chia thành từng scene
          với visual prompt, voiceover, camera angle — phục vụ trực tiếp cho việc tạo video prompt.
        </p>

        {/* Row 1: Idea + Product */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ý tưởng video *</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={3}
              placeholder="Mô tả ý tưởng chính của video. VD: Quảng cáo nước rửa chén hương chanh, nhấn mạnh sạch dầu mỡ nhanh, phù hợp gia đình Việt"
              className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sản phẩm / Dịch vụ</label>
            <textarea
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              rows={3}
              placeholder="Tên sản phẩm, đặc điểm nổi bật, USP. VD: Nước rửa chén Sunlight hương chanh 750ml - sạch 100x dầu mỡ"
              className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-sm"
            />
          </div>
        </div>

        {/* Row 2: Target audience + Emotion */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Đối tượng mục tiêu</label>
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="VD: Phụ nữ 25-40 tuổi, nội trợ, quan tâm sức khỏe gia đình"
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Cảm xúc chủ đạo</label>
            <input
              value={emotionStyle}
              onChange={(e) => setEmotionStyle(e.target.value)}
              placeholder="VD: Vui vẻ, tin tưởng, gần gũi, chuyên nghiệp"
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
            />
          </div>
        </div>

        {/* Row 3: Scene description */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Mô tả bối cảnh / Setting</label>
          <textarea
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            rows={2}
            placeholder="VD: Bếp gia đình hiện đại, sáng sủa, có bồn rửa chén, ánh sáng tự nhiên từ cửa sổ. KOL mặc áo sơ mi trắng, tóc buộc gọn."
            className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-sm"
          />
        </div>

        {/* Row 4: Technical settings */}
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Thời lượng (s)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={10}
              max={120}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hook style</label>
            <select
              value={hookStyle}
              onChange={(e) => setHookStyle(e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
            >
              <option value="curiosity" className="bg-gray-900">Curiosity</option>
              <option value="question" className="bg-gray-900">Question</option>
              <option value="shock" className="bg-gray-900">Shock</option>
              <option value="pain_point" className="bg-gray-900">Pain point</option>
              <option value="story" className="bg-gray-900">Story</option>
              <option value="statistic" className="bg-gray-900">Statistic</option>
              <option value="transformation" className="bg-gray-900">Transformation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">CTA goal</label>
            <select
              value={ctaGoal}
              onChange={(e) => setCta(e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
            >
              <option value="engagement" className="bg-gray-900">Engagement</option>
              <option value="purchase" className="bg-gray-900">Purchase</option>
              <option value="follow" className="bg-gray-900">Follow</option>
              <option value="share" className="bg-gray-900">Share</option>
              <option value="visit" className="bg-gray-900">Visit website</option>
              <option value="download" className="bg-gray-900">Download</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Ngôn ngữ</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
            >
              <option value="vi" className="bg-gray-900">Tiếng Việt</option>
              <option value="en" className="bg-gray-900">English</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm font-medium"
            >
              {generating ? "Đang tạo..." : "⚡ Tạo kịch bản"}
            </button>
          </div>
        </div>
      </div>

      {/* Script output */}
      {script && (
        <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">📝 Kịch bản (v{script.version})</h2>
            <span className="text-xs text-gray-500">
              {script.provider} / {script.model}
            </span>
          </div>

          {script.content && (
            <pre className="text-sm whitespace-pre-wrap text-gray-300 bg-black/30 rounded p-3 max-h-64 overflow-y-auto">
              {script.content}
            </pre>
          )}

          {script.structured_content && Object.keys(script.structured_content).length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-400 hover:text-white">
                Nội dung cấu trúc (JSON)
              </summary>
              <pre className="mt-2 p-2 bg-black/30 rounded overflow-x-auto text-gray-400">
                {JSON.stringify(script.structured_content, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Scenes output */}
      {scenes.length > 0 && (
        <div className="border border-white/10 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">🎞 Phân cảnh ({scenes.length})</h2>
          <div className="space-y-2">
            {scenes.map((s) => (
              <SceneCard
                key={s.id}
                scene={s}
                campaignId={campaignId}
                kolId={kolId}
                campaignAssets={campaignAssets}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Scene Card with Render Button
// ════════════════════════════════════════════════════════════

function SceneCard({
  scene,
  campaignId,
  kolId,
  campaignAssets = [],
}: {
  scene: CampaignSceneRecord;
  campaignId: string;
  kolId: string;
  campaignAssets: { id: string; file_url: string | null; name: string; asset_type: string }[];
}) {
  const [rendering, setRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(scene.visual_prompt || "");
  const [sceneRefImages, setSceneRefImages] = useState<string[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [resolution, setResolution] = useState("720p");

  const handleRender = async () => {
    const prompt = customPrompt.trim() || scene.visual_prompt;
    if (!prompt) {
      setRenderError("Scene chưa có visual prompt");
      return;
    }

    setRendering(true);
    setRenderError(null);
    try {
      const res = await fetch("/api/kol-admin/campaign/render-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          sceneId: scene.id,
          kolId,
          prompt,
          duration: scene.duration_seconds || 6,
          aspectRatio,
          cameraAngle: scene.camera_angle,
          cameraMotion: scene.camera_movement,
          // Use first reference image as start frame for image-to-video
          referenceImageUrl: sceneRefImages.length > 0 ? sceneRefImages[0] : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVideoUrl(data.outputUrl);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : String(err));
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="border border-white/5 rounded p-3 text-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gray-400">
          Scene {scene.scene_order} · {scene.duration_seconds}s
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            videoUrl ? "bg-green-500/20 text-green-400" :
            rendering ? "bg-yellow-500/20 text-yellow-400 animate-pulse" :
            "bg-gray-500/20 text-gray-400"
          }`}>
            {videoUrl ? "rendered" : rendering ? "rendering..." : scene.status}
          </span>
        </div>
      </div>

      {/* Visual prompt (editable) */}
      {editingPrompt ? (
        <div className="space-y-1">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs"
          />
          <div className="flex gap-1">
            <button
              onClick={() => setEditingPrompt(false)}
              className="px-2 py-0.5 text-[10px] bg-blue-600 rounded"
            >
              Xong
            </button>
            <button
              onClick={() => { setCustomPrompt(scene.visual_prompt || ""); setEditingPrompt(false); }}
              className="px-2 py-0.5 text-[10px] border border-white/10 rounded"
            >
              Đặt lại
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-gray-300 text-xs cursor-pointer hover:text-white"
          onClick={() => setEditingPrompt(true)}
          title="Click để sửa prompt"
        >
          {customPrompt || scene.visual_prompt || "Chưa có visual prompt"}
        </div>
      )}

      {scene.voiceover && (
        <div className="text-gray-500 text-xs italic">🎙 {scene.voiceover}</div>
      )}

      <div className="flex gap-3 text-[10px] text-gray-500">
        {scene.camera_angle && <span>📷 {scene.camera_angle}</span>}
        {scene.camera_movement && <span>🎥 {scene.camera_movement}</span>}
        {scene.transition && <span>↔ {scene.transition}</span>}
      </div>

      {/* V3.2 scene data details */}
      {scene.scene_data && typeof scene.scene_data === "object" && (
        <details className="text-[10px] text-gray-500">
          <summary className="cursor-pointer hover:text-white">Chi tiết V3.2</summary>
          <div className="mt-1 space-y-0.5 pl-2 border-l border-white/10">
            {(scene.scene_data as Record<string, unknown>).shot_type && (
              <div>Góc quay: {String((scene.scene_data as Record<string, unknown>).shot_type)}</div>
            )}
            {(scene.scene_data as Record<string, unknown>).facial_expression && (
              <div>Biểu cảm: {String((scene.scene_data as Record<string, unknown>).facial_expression)}</div>
            )}
            {(scene.scene_data as Record<string, unknown>).outfit_lock && (
              <div>Trang phục: {String((scene.scene_data as Record<string, unknown>).outfit_lock).slice(0, 80)}</div>
            )}
            {(scene.scene_data as Record<string, unknown>).background_lock && (
              <div>Bối cảnh: {String((scene.scene_data as Record<string, unknown>).background_lock).slice(0, 80)}</div>
            )}
            {(scene.scene_data as Record<string, unknown>).product_visibility && (
              <div>Sản phẩm: {String((scene.scene_data as Record<string, unknown>).product_visibility)}</div>
            )}
          </div>
        </details>
      )}

      {/* Render controls */}
      <div className="space-y-2 pt-1 border-t border-white/5">
        {/* Reference images for this scene */}
        <div>
          <div className="text-[10px] text-gray-400 mb-1">📎 Ảnh tham chiếu cho scene (KOL 8 góc, sản phẩm, KOL cầm SP...)</div>
          <div className="flex gap-1 flex-wrap">
            {sceneRefImages.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-10 h-10 object-cover rounded border border-white/10" />
                <button
                  onClick={() => setSceneRefImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="w-10 h-10 border border-dashed border-white/20 rounded flex items-center justify-center text-[10px] text-gray-500 cursor-pointer hover:border-white/40">
              +
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((f) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (reader.result) {
                        setSceneRefImages((prev) => [...prev, reader.result as string]);
                      }
                    };
                    reader.readAsDataURL(f);
                  });
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {/* Quick select from campaign assets */}
          <button
            onClick={() => setShowAssetPicker(!showAssetPicker)}
            className="text-[10px] text-blue-400 hover:text-blue-300 mt-1"
          >
            {showAssetPicker ? "Ẩn ▲" : `Chọn từ ảnh campaign (${campaignAssets.filter((a) => a.file_url).length}) ▼`}
          </button>
          {showAssetPicker && (
            <div className="mt-1 p-2 border border-white/10 rounded bg-white/5 max-h-40 overflow-y-auto">
              <div className="text-[9px] text-gray-500 mb-1.5">Click ảnh để chọn (có thể chọn nhiều)</div>
              {campaignAssets.filter((a) => a.file_url).length === 0 && (
                <div className="text-[9px] text-gray-500 italic">Chưa có ảnh. Upload ảnh sản phẩm hoặc tạo ảnh KOL ở Campaign Studio.</div>
              )}
              <div className="flex gap-1.5 flex-wrap">
                {campaignAssets
                  .filter((a) => a.file_url)
                  .map((a) => {
                    const isSelected = sceneRefImages.includes(a.file_url!);
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <div
                        key={a.id}
                        className={`relative cursor-pointer rounded overflow-hidden ${
                          isSelected ? "ring-2 ring-green-400" : "hover:ring-1 hover:ring-white/30"
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSceneRefImages((prev) => prev.filter((url) => url !== a.file_url));
                          } else {
                            setSceneRefImages((prev) => [...prev, a.file_url!]);
                          }
                        }}
                      >
                        <img
                          src={a.file_url!}
                          alt={a.name}
                          className="w-12 h-12 object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <span className="text-green-400 text-sm">✓</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[7px] text-center py-0.5 truncate px-0.5">
                          {a.asset_type === "product_image" ? "📦" : "🎨"} {a.name.slice(0, 12)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px]"
          >
            <option value="9:16" className="bg-gray-900">9:16 (Dọc)</option>
            <option value="16:9" className="bg-gray-900">16:9 (Ngang)</option>
            <option value="1:1" className="bg-gray-900">1:1 (Vuông)</option>
          </select>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px]"
          >
            <option value="480p" className="bg-gray-900">480p</option>
            <option value="720p" className="bg-gray-900">720p</option>
            <option value="1080p" className="bg-gray-900">1080p</option>
          </select>
          <button
            onClick={handleRender}
            disabled={rendering}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs font-medium"
          >
            {rendering ? "⏳ Đang tạo video..." : "🎬 Tạo Video"}
          </button>
          <button
            onClick={() => setEditingPrompt(true)}
            className="px-2 py-1 border border-white/10 rounded text-[10px] hover:bg-white/5"
          >
            ✏️ Sửa Prompt
          </button>
          {sceneRefImages.length > 0 && (
            <span className="text-[10px] text-green-400">
              {sceneRefImages.length} ảnh tham chiếu
            </span>
          )}
        </div>
      </div>

      {/* Render error */}
      {renderError && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded p-2">
          {renderError}
        </div>
      )}

      {/* Video result */}
      {videoUrl && (
        <div className="mt-2">
          <video
            src={videoUrl}
            controls
            className="w-full max-h-48 rounded bg-black"
          />
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-400 hover:underline mt-1 block"
          >
            Mở tab mới ↗
          </a>
        </div>
      )}
    </div>
  );
}
