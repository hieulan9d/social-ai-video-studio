"use client";

import { useCallback, useEffect, useState } from "react";

type StyleTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  prompt_template: string;
  variables: { key: string; label: string; placeholder: string; type?: string }[];
  usage_count: number;
  created_at: string;
};

type GenerationResult = {
  outputUrls: string[];
  finalPrompt: string;
  generationTimeMs: number;
};

const CATEGORIES = [
  { value: "product_ad", label: "Quảng cáo sản phẩm" },
  { value: "beauty", label: "Làm đẹp" },
  { value: "fashion", label: "Thời trang" },
  { value: "food", label: "Ẩm thực" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "luxury", label: "Cao cấp" },
  { value: "healthcare", label: "Sức khỏe" },
  { value: "education", label: "Giáo dục" },
  { value: "general", label: "Chung" },
];

export function StyleStudio() {
  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<StyleTemplate | null>(null);
  const [filledVars, setFilledVars] = useState<Record<string, string>>({});
  const [refImageUrl, setRefImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/kol-admin/styles");
      const data = await res.json();
      if (res.ok) setTemplates(data.templates || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleSelectTemplate = (t: StyleTemplate) => {
    setSelectedTemplate(t);
    setFilledVars({});
    setResult(null);
    setError(null);
    setRefImageUrl(null);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/kol-admin/styles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          filledVariables: filledVars,
          referenceImageUrl: refImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa phong cách này?")) return;
    await fetch(`/api/kol-admin/styles/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplate?.id === id) setSelectedTemplate(null);
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRefImageUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* LEFT: Template list */}
      <div className="col-span-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm">Phong cách ({templates.length})</div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            + Tạo mới
          </button>
        </div>

        {showCreateForm && <CreateTemplateForm onCreated={() => { loadTemplates(); setShowCreateForm(false); }} />}

        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedTemplate?.id === t.id
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-white/10 hover:bg-white/5"
              }`}
              onClick={() => handleSelectTemplate(t)}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{t.name}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  🗑
                </button>
              </div>
              {t.description && (
                <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
              )}
              <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                <span>{CATEGORIES.find((c) => c.value === t.category)?.label || t.category}</span>
                <span>·</span>
                <span>{t.variables?.length || 0} biến</span>
                <span>·</span>
                <span>{t.usage_count} lần dùng</span>
              </div>
            </div>
          ))}
          {templates.length === 0 && !showCreateForm && (
            <div className="text-xs text-gray-500 p-4 border border-white/10 rounded-lg text-center">
              Chưa có phong cách nào. Nhấn &quot;+ Tạo mới&quot; để bắt đầu.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Generate panel */}
      <div className="col-span-8 space-y-4">
        {!selectedTemplate ? (
          <div className="border border-white/10 rounded-lg p-8 text-center text-gray-500 text-sm">
            ← Chọn một phong cách bên trái để bắt đầu tạo ảnh
          </div>
        ) : (
          <>
            <div className="border border-white/10 rounded-lg p-4 space-y-3">
              <div className="font-semibold">{selectedTemplate.name}</div>
              {selectedTemplate.description && (
                <div className="text-xs text-gray-400">{selectedTemplate.description}</div>
              )}

              {/* Variables form */}
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 font-medium">Điền thông tin:</div>
                  {selectedTemplate.variables.map((v) => (
                    <div key={v.key}>
                      <label className="block text-xs text-gray-400 mb-0.5">{v.label}</label>
                      {v.type === "textarea" ? (
                        <textarea
                          value={filledVars[v.key] || ""}
                          onChange={(e) => setFilledVars((prev) => ({ ...prev, [v.key]: e.target.value }))}
                          placeholder={v.placeholder}
                          rows={2}
                          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
                        />
                      ) : (
                        <input
                          value={filledVars[v.key] || ""}
                          onChange={(e) => setFilledVars((prev) => ({ ...prev, [v.key]: e.target.value }))}
                          placeholder={v.placeholder}
                          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reference image upload */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Ảnh sản phẩm / tham chiếu (tùy chọn)</label>
                <div className="flex gap-2 items-center">
                  <label className="px-3 py-1.5 border border-dashed border-white/20 rounded text-xs cursor-pointer hover:border-white/40">
                    📎 Upload ảnh
                    <input type="file" accept="image/*" className="hidden" onChange={handleRefUpload} />
                  </label>
                  {refImageUrl && (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={refImageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                      <button onClick={() => setRefImageUrl(null)} className="text-red-400 text-xs">✕</button>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm font-medium"
              >
                {generating ? "⏳ Đang tạo ảnh..." : "⚡ Tạo ảnh theo phong cách"}
              </button>
            </div>

            {error && (
              <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {result && (
              <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-4 space-y-3">
                <div className="font-semibold text-green-400">✅ Kết quả ({result.generationTimeMs}ms)</div>
                <div className="grid grid-cols-2 gap-2">
                  {result.outputUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Output ${i + 1}`} className="w-full rounded" />
                  ))}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-400">Xem prompt đã dùng</summary>
                  <pre className="mt-1 p-2 bg-black/30 rounded text-gray-400 whitespace-pre-wrap text-[10px]">
                    {result.finalPrompt}
                  </pre>
                </details>
              </div>
            )}

            {/* Show template prompt */}
            <details className="text-xs border border-white/10 rounded-lg p-3">
              <summary className="cursor-pointer text-gray-400 font-medium">Xem prompt template gốc</summary>
              <pre className="mt-2 p-2 bg-black/30 rounded text-gray-400 whitespace-pre-wrap text-[10px]">
                {selectedTemplate.prompt_template}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Create Template Form
// ════════════════════════════════════════════════════════════

function CreateTemplateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("product_ad");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [variablesText, setVariablesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim() || !promptTemplate.trim()) {
      setError("Tên và prompt template bắt buộc");
      return;
    }

    // Parse variables from text (format: key|label|placeholder per line)
    const variables = variablesText
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        return {
          key: parts[0] || "",
          label: parts[1] || parts[0] || "",
          placeholder: parts[2] || "",
          type: parts[3] || "text",
        };
      })
      .filter((v) => v.key);

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/kol-admin/styles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          promptTemplate: promptTemplate.trim(),
          variables,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-blue-500/30 bg-blue-500/5 rounded-lg p-3 space-y-2">
      <div className="font-semibold text-sm">Tạo phong cách mới</div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên phong cách (VD: Quảng cáo mỹ phẩm luxury)"
        className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
      />

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Mô tả ngắn (tùy chọn)"
        className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-sm"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value} className="bg-gray-900">{c.label}</option>
        ))}
      </select>

      <div>
        <label className="block text-xs text-gray-400 mb-0.5">
          Prompt Template (dùng {"{{tên_biến}}"} cho phần thay đổi)
        </label>
        <textarea
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          rows={6}
          placeholder={`VD: Create a luxury cosmetic advertisement photo featuring {{product_name}}. The product is {{product_description}}. Style: elegant, soft lighting, marble surface, gold accents. {{additional_notes}}`}
          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs font-mono"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-0.5">
          Biến (mỗi dòng: key|label|placeholder|type)
        </label>
        <textarea
          value={variablesText}
          onChange={(e) => setVariablesText(e.target.value)}
          rows={4}
          placeholder={`product_name|Tên sản phẩm|VD: Serum Vitamin C 30ml
product_description|Mô tả sản phẩm|VD: Chai thủy tinh trong, nắp vàng|textarea
additional_notes|Ghi chú thêm|VD: Thêm hoa hồng xung quanh`}
          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs font-mono"
        />
        <div className="text-[9px] text-gray-500 mt-0.5">
          Format: key|label|placeholder|type (type: text hoặc textarea)
        </div>
      </div>

      {error && <div className="text-xs text-red-400">{error}</div>}

      <button
        onClick={handleCreate}
        disabled={saving}
        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs font-medium"
      >
        {saving ? "Đang lưu..." : "💾 Lưu phong cách"}
      </button>
    </div>
  );
}
