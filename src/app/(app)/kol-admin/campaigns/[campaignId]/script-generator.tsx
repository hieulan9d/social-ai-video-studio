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
};

export function ScriptGenerator({
  campaignId,
  kolId,
  platform,
  contentType,
  existingScript,
  existingScenes,
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
            <label className="block text-xs text-gray-400 mb-1">Duration (s)</label>
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
              {generating ? "Đang tạo..." : "⚡ Generate Script"}
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
                Structured content (JSON)
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
          <h2 className="font-semibold">🎞 Scenes ({scenes.length})</h2>
          <div className="space-y-2">
            {scenes.map((s) => (
              <SceneCard
                key={s.id}
                scene={s}
                campaignId={campaignId}
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
}: {
  scene: CampaignSceneRecord;
  campaignId: string;
}) {
  const [rendering, setRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(scene.visual_prompt || "");

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
          prompt,
          duration: scene.duration_seconds || 6,
          aspectRatio: "9:16",
          cameraAngle: scene.camera_angle,
          cameraMotion: scene.camera_movement,
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
              Done
            </button>
            <button
              onClick={() => { setCustomPrompt(scene.visual_prompt || ""); setEditingPrompt(false); }}
              className="px-2 py-0.5 text-[10px] border border-white/10 rounded"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-gray-300 text-xs cursor-pointer hover:text-white"
          onClick={() => setEditingPrompt(true)}
          title="Click to edit prompt"
        >
          {customPrompt || scene.visual_prompt || "No visual prompt"}
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

      {/* Render controls */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <button
          onClick={handleRender}
          disabled={rendering}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs font-medium"
        >
          {rendering ? "⏳ Rendering..." : "🎬 Render Video"}
        </button>
        <button
          onClick={() => setEditingPrompt(true)}
          className="px-2 py-1 border border-white/10 rounded text-[10px] hover:bg-white/5"
        >
          ✏️ Edit Prompt
        </button>
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
            Open in new tab ↗
          </a>
        </div>
      )}
    </div>
  );
}
