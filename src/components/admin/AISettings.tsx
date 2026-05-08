"use client";

import { useState } from "react";

interface TestResult {
  ok: boolean;
  model?: string;
  error?: string;
}

interface ConnectionData {
  provider: string;
  baseUrl: string;
  hasApiKey: boolean;
  modelConfig: Record<string, string>;
  tests: {
    chatgpt_text: TestResult;
    gemini_text: TestResult;
    gpt_image: TestResult;
    veo_video: TestResult;
  };
  overallStatus: string;
}

const MODEL_TASK_LABELS: Record<string, string> = {
  chat: "Chat (mặc định)",
  prompt: "Viết Prompt",
  script: "Viết Kịch bản",
  reasoning: "Phân tích nâng cao",
  gemini_text: "Gemini Text",
  gemini_fast: "Gemini Fast",
  image: "Tạo Ảnh",
  video: "Tạo Video",
  video_fast: "Tạo Video Nhanh",
};

export default function AdminAISettings() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConnectionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTest() {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/ai/test-connection");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">AI Settings</h1>
        <p className="text-gray-400 text-sm">
          Cấu hình và kiểm tra kết nối AI qua 9Router
        </p>
      </div>

      {/* Env config cards */}
      <div className="grid grid-cols-2 gap-3">
        <ConfigCard label="Provider" value={process.env.NEXT_PUBLIC_AI_PROVIDER ?? "9router"} />
        <ConfigCard label="Base URL" value="http://localhost:20128/v1 (xem .env)" mono />
        <ConfigCard label="API Key" value="****** (ẩn vì bảo mật)" />
        <ConfigCard label="Trạng thái" value={data ? data.overallStatus : "Chưa test"} highlight />
      </div>

      {/* Model config — chỉ hiện sau khi test */}
      {data && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
            Model đang dùng
          </h2>
          {Object.entries(data.modelConfig).map(([task, model]) => (
            <div key={task} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {MODEL_TASK_LABELS[task] ?? task}
              </span>
              <span className="font-mono text-purple-300">{model}</span>
            </div>
          ))}
        </div>
      )}

      {/* Test buttons */}
      <div className="space-y-3">
        <button
          onClick={runTest}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {loading ? "⏳ Đang kiểm tra kết nối..." : "🔌 Test Connection (ChatGPT + Gemini + Image)"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-4">
          <p className="text-red-300 text-sm font-mono">{error}</p>
        </div>
      )}

      {/* Test results */}
      {data && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Kết quả kiểm tra
          </h2>
          <TestRow
            label="ChatGPT Text"
            model={data.tests.chatgpt_text.model}
            ok={data.tests.chatgpt_text.ok}
            error={data.tests.chatgpt_text.error}
          />
          <TestRow
            label="Gemini Text"
            model={data.tests.gemini_text.model}
            ok={data.tests.gemini_text.ok}
            error={data.tests.gemini_text.error}
          />
          <TestRow
            label="GPT Image"
            model={data.tests.gpt_image.model}
            ok={data.tests.gpt_image.ok}
            error={data.tests.gpt_image.error}
          />
          <TestRow
            label="Veo Video (cấu hình)"
            model={data.tests.veo_video.model}
            ok={data.tests.veo_video.ok}
            note="Không test thật để tiết kiệm credits"
          />
        </div>
      )}

      {/* Setup guide */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm space-y-2">
        <h2 className="font-semibold text-gray-200">Cách điền .env</h2>
        <pre className="text-gray-400 font-mono text-xs leading-relaxed whitespace-pre-wrap">
{`AI_PROVIDER=9router
AI_BASE_URL=http://localhost:20128/v1
AI_API_KEY=your_9router_api_key

AI_DEFAULT_TEXT_MODEL=gpt-4o-mini
AI_REASONING_MODEL=gpt-4.1
AI_PROMPT_MODEL=gpt-4o-mini
AI_SCRIPT_MODEL=gpt-4.1
AI_GEMINI_TEXT_MODEL=gemini-2.5-pro
AI_GEMINI_FAST_MODEL=gemini-2.5-flash
AI_IMAGE_MODEL=gpt-image-1
AI_VIDEO_MODEL=veo-3
AI_VIDEO_FAST_MODEL=veo-3-fast`}
        </pre>
      </div>
    </div>
  );
}

function ConfigCard({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-sm font-medium truncate ${mono ? "font-mono text-blue-300" : highlight ? "text-green-300" : "text-gray-200"}`}
      >
        {value}
      </p>
    </div>
  );
}

function TestRow({
  label,
  ok,
  model,
  error,
  note,
}: {
  label: string;
  ok: boolean;
  model?: string;
  error?: string;
  note?: string;
}) {
  return (
    <div
      className={`flex items-start justify-between p-3 rounded-xl border text-sm ${
        ok
          ? "bg-green-900/20 border-green-700/50"
          : "bg-red-900/20 border-red-700/50"
      }`}
    >
      <div>
        <span className={ok ? "text-green-300 font-medium" : "text-red-300 font-medium"}>
          {ok ? "✅" : "❌"} {label}
        </span>
        {(error || note) && (
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{error ?? note}</p>
        )}
      </div>
      {model && (
        <span className="text-xs font-mono text-purple-300 ml-4 shrink-0">{model}</span>
      )}
    </div>
  );
}
