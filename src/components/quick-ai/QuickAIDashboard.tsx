"use client";

import { useState, useRef } from "react";

type Tab = "prompt" | "script" | "image" | "video";
type VideoMode = "text-to-video" | "image-to-video" | "start-end-image-to-video";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "prompt", label: "Tạo Prompt", emoji: "✍️" },
  { id: "script", label: "Tạo Kịch bản", emoji: "📝" },
  { id: "image", label: "Tạo Ảnh", emoji: "🖼️" },
  { id: "video", label: "Tạo Video", emoji: "🎬" },
];

export default function QuickAIDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("prompt");

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Tạo nhanh AI</h1>
        <p className="text-gray-400 text-sm">
          Tạo prompt, kịch bản, ảnh và video AI trong một giao diện
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "prompt" && <PromptTab />}
        {activeTab === "script" && <ScriptTab />}
        {activeTab === "image" && <ImageTab />}
        {activeTab === "video" && <VideoTab />}
      </div>
    </div>
  );
}

// ─── PROMPT TAB ───────────────────────────────────────────────────────────────
function PromptTab() {
  const [idea, setIdea] = useState("");
  const [type, setType] = useState("video_ad");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const TYPE_SYSTEM: Record<string, string> = {
    image_ad:
      "Bạn là chuyên gia viết prompt ảnh quảng cáo cho AI image generator. Viết prompt chi tiết bằng tiếng Anh, mô tả visual rõ ràng, phong cách chuyên nghiệp.",
    video_ad:
      "Bạn là chuyên gia viết prompt video quảng cáo cho AI video generator (Veo 3). Viết prompt bằng tiếng Anh, mô tả cảnh quay, góc máy, ánh sáng, chuyển động.",
    tiktok_script:
      "Bạn là chuyên gia nội dung TikTok Việt Nam. Viết kịch bản TikTok ngắn gọn, thu hút, phù hợp xu hướng.",
    product_desc:
      "Bạn là copywriter thương mại điện tử. Viết mô tả sản phẩm hấp dẫn, tập trung vào lợi ích, phù hợp TikTok Shop/Shopee.",
  };

  const TYPE_LABELS: Record<string, string> = {
    image_ad: "Ảnh quảng cáo",
    video_ad: "Video quảng cáo",
    tiktok_script: "Kịch bản TikTok",
    product_desc: "Mô tả sản phẩm",
  };

  async function handleGenerate() {
    if (!idea.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "prompt",
          systemPrompt: TYPE_SYSTEM[type],
          prompt: `Ý tưởng: ${idea}\nLoại: ${TYPE_LABELS[type]}\n\nViết prompt phù hợp.`,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.text);
      else setError(data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Ý tưởng ngắn</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="VD: Son môi màu đỏ cho phụ nữ hiện đại, giá 200k..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm resize-none h-24 focus:outline-none focus:border-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Loại prompt</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading || !idea.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "⏳ Đang tạo..." : "✨ Tạo Prompt"}
      </button>
      <ResultBox result={result} error={error} />
    </div>
  );
}

// ─── SCRIPT TAB ───────────────────────────────────────────────────────────────
function ScriptTab() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("30s");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "script",
          systemPrompt:
            "Bạn là chuyên gia sản xuất nội dung quảng cáo TikTok/Reels Việt Nam. Viết kịch bản theo cấu trúc: Hook → Vấn đề → Giải pháp → Sản phẩm/Dịch vụ → CTA. Định dạng rõ ràng, phân cảnh cụ thể.",
          prompt: `Chủ đề: ${topic}\nThời lượng: ${duration}\n\nViết kịch bản quảng cáo đầy đủ, phân cảnh chi tiết.`,
          maxTokens: 1500,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data.text);
      else setError(data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Chủ đề</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="VD: Quảng cáo kem dưỡng da trắng sáng cho phụ nữ 25-35 tuổi..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm resize-none h-24 focus:outline-none focus:border-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Thời lượng</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="15s">15 giây</option>
          <option value="30s">30 giây</option>
          <option value="60s">60 giây</option>
          <option value="2 phút">2 phút</option>
        </select>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading || !topic.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "⏳ Đang viết kịch bản..." : "📝 Tạo Kịch bản"}
      </button>
      <ResultBox result={result} error={error} />
    </div>
  );
}

// ─── IMAGE TAB ────────────────────────────────────────────────────────────────
function ImageTab() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1024x1024" | "1024x1536" | "1536x1024">("1024x1024");
  const [quality, setQuality] = useState<"low" | "medium" | "high">("high");
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setImageBase64(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, quality }),
      });
      const data = await res.json();
      if (data.success) {
        setImageBase64(data.imageBase64 ?? null);
        setImageUrl(data.imageUrl ?? null);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  const imgSrc = imageBase64
    ? `data:image/png;base64,${imageBase64}`
    : imageUrl ?? null;

  function handleDownload() {
    if (!imgSrc) return;
    const a = document.createElement("a");
    a.href = imgSrc;
    a.download = `ai-image-${Date.now()}.png`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="VD: A beautiful Vietnamese woman holding a skincare product, studio lighting, clean white background..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm resize-none h-28 focus:outline-none focus:border-purple-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Kích thước</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as typeof size)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="1024x1024">1024×1024 (vuông)</option>
            <option value="1024x1536">1024×1536 (dọc)</option>
            <option value="1536x1024">1536×1024 (ngang)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Chất lượng</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as typeof quality)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="low">Thấp (nhanh)</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao (chậm hơn)</option>
          </select>
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "⏳ Đang tạo ảnh..." : "🖼️ Tạo Ảnh"}
      </button>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {imgSrc && (
        <div className="space-y-3">
          <img
            src={imgSrc}
            alt="AI generated"
            className="w-full rounded-xl border border-gray-700 object-contain max-h-96"
          />
          <button
            onClick={handleDownload}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            ⬇️ Tải ảnh xuống
          </button>
        </div>
      )}
    </div>
  );
}

// ─── VIDEO TAB ────────────────────────────────────────────────────────────────
function VideoTab() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<VideoMode>("text-to-video");
  const [duration, setDuration] = useState<5 | 8 | 10>(5);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [fast, setFast] = useState(false);
  const [startFile, setStartFile] = useState<File | null>(null);
  const [endFile, setEndFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ videoUrl?: string; jobId?: string; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip data:image/...;base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let startImage: string | undefined;
      let endImage: string | undefined;

      if (
        (mode === "image-to-video" || mode === "start-end-image-to-video") &&
        startFile
      ) {
        startImage = await fileToBase64(startFile);
      }

      if (mode === "start-end-image-to-video" && endFile) {
        endImage = await fileToBase64(endFile);
      }

      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode,
          startImage,
          endImage,
          duration,
          aspectRatio,
          fast,
        }),
      });
      const data = await res.json();
      if (data.success) setResult(data);
      else setError(data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="VD: A young woman applying lipstick, close-up shot, warm studio lighting, smooth cinematic motion..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm resize-none h-28 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Chế độ</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as VideoMode)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="text-to-video">Text → Video</option>
          <option value="image-to-video">Image → Video (cần ảnh đầu)</option>
          <option value="start-end-image-to-video">Start + End Image → Video</option>
        </select>
      </div>

      {/* Upload areas */}
      {(mode === "image-to-video" || mode === "start-end-image-to-video") && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Ảnh bắt đầu</label>
          <input
            ref={startInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setStartFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            onClick={() => startInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-4 text-sm transition-colors ${
              startFile
                ? "border-purple-500 text-purple-300"
                : "border-gray-600 text-gray-500 hover:border-gray-500"
            }`}
          >
            {startFile ? `✅ ${startFile.name}` : "📁 Chọn ảnh bắt đầu"}
          </button>
        </div>
      )}

      {mode === "start-end-image-to-video" && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Ảnh kết thúc</label>
          <input
            ref={endInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setEndFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            onClick={() => endInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-xl p-4 text-sm transition-colors ${
              endFile
                ? "border-purple-500 text-purple-300"
                : "border-gray-600 text-gray-500 hover:border-gray-500"
            }`}
          >
            {endFile ? `✅ ${endFile.name}` : "📁 Chọn ảnh kết thúc"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Thời lượng</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) as 5 | 8 | 10)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value={5}>5 giây</option>
            <option value={8}>8 giây</option>
            <option value={10}>10 giây</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tỉ lệ</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as typeof aspectRatio)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="16:9">16:9 (YouTube/ngang)</option>
            <option value="9:16">9:16 (TikTok/dọc)</option>
            <option value="1:1">1:1 (vuông)</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={fast}
          onChange={(e) => setFast(e.target.checked)}
          className="w-4 h-4 accent-purple-500"
        />
        <span className="text-sm text-gray-400">
          Dùng Veo 3 Fast (nhanh hơn, chất lượng thấp hơn)
        </span>
      </label>

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "⏳ Đang tạo video..." : "🎬 Tạo Video"}
      </button>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm text-gray-300">
              Trạng thái: <span className="text-green-300 font-medium">{result.status}</span>
            </span>
          </div>
          {result.jobId && (
            <p className="text-xs text-gray-500 font-mono">Job ID: {result.jobId}</p>
          )}
          {result.videoUrl && (
            <video
              src={result.videoUrl}
              controls
              className="w-full rounded-xl border border-gray-700"
            />
          )}
          {!result.videoUrl && (
            <p className="text-sm text-yellow-300">
              ⏳ Video đang được render. Kiểm tra lại sau ít phút bằng Job ID.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SHARED: Result box ───────────────────────────────────────────────────────
function ResultBox({
  result,
  error,
}: {
  result: string | null;
  error: string | null;
}) {
  if (error) {
    return (
      <div className="bg-red-900/40 border border-red-700 rounded-xl p-3">
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }
  if (!result) return null;

  function handleCopy() {
    navigator.clipboard.writeText(result!);
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 uppercase tracking-wide">Kết quả</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          📋 Sao chép
        </button>
      </div>
      <pre className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-sans">
        {result}
      </pre>
    </div>
  );
}
