"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AvatarSessionRecord,
  AvatarGenerationRecord,
  AvatarReferenceImageRecord,
  AvatarReferenceRole,
  IdentityLockRecord,
} from "@/modules/ai-kol-system";

const ROLES: { value: AvatarReferenceRole; label: string }[] = [
  { value: "face", label: "Face" },
  { value: "hair", label: "Hair" },
  { value: "makeup", label: "Makeup" },
  { value: "outfit", label: "Outfit" },
  { value: "style", label: "Style" },
  { value: "pose", label: "Pose" },
  { value: "general", label: "General" },
];

type Props = {
  kolId: string;
  kolName: string;
  userId: string;
  existingLock: IdentityLockRecord | null;
};

export function AvatarStudio({ kolId, existingLock }: Props) {
  const [session, setSession] = useState<AvatarSessionRecord | null>(null);
  const [generations, setGenerations] = useState<AvatarGenerationRecord[]>([]);
  const [references, setReferences] = useState<AvatarReferenceImageRecord[]>([]);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(0);
  const [prompt, setPrompt] = useState("");
  const [candidateCount, setCandidateCount] = useState(2);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(Boolean(existingLock?.is_locked));

  // ── Load session on mount ───────────────────────────────

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/kol-admin/avatar/session?kolId=${kolId}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = data.action
          ? `${data.error}\n\n→ ${data.action}`
          : data.error || "Failed to load session";
        throw new Error(msg);
      }

      setSession(data.session);
      setGenerations(data.generations || []);
      setReferences(data.references || []);

      // Auto-select latest selected or last completed generation
      const selected = data.generations?.find((g: AvatarGenerationRecord) => g.selected);
      const lastCompleted = [...(data.generations || [])].reverse().find(
        (g: AvatarGenerationRecord) => g.status === "completed"
      );
      const target = selected || lastCompleted;
      if (target) {
        setSelectedGenerationId(target.id);
        setSelectedCandidateIndex(target.selected_candidate_index ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [kolId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ── Upload reference image ──────────────────────────────

  const handleUpload = async (file: File, role: AvatarReferenceRole) => {
    if (!session) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("sessionId", session.id);
      formData.append("kolId", kolId);
      formData.append("role", role);
      formData.append("file", file);

      const res = await fetch("/api/kol-admin/avatar/reference", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setReferences((prev) => [...prev, data.reference]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveReference = async (id: string, path: string) => {
    try {
      await fetch(`/api/kol-admin/avatar/reference?id=${id}&path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      setReferences((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Generate ────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!session) return;
    if (prompt.trim().length < 3) {
      setError("Prompt phải có ít nhất 3 ký tự");
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/kol-admin/avatar/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          kolId,
          prompt: prompt.trim(),
          parentGenerationId: selectedGenerationId,
          candidateCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      // Reload to get updated session + generations
      await loadSession();
      setPrompt("");
      setSelectedGenerationId(data.generation.id);
      setSelectedCandidateIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  // ── Select candidate ────────────────────────────────────

  const handleSelectCandidate = async (generationId: string, candidateIndex: number) => {
    setSelectedGenerationId(generationId);
    setSelectedCandidateIndex(candidateIndex);
    try {
      await fetch("/api/kol-admin/avatar/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId, candidateIndex }),
      });
    } catch {
      // best effort
    }
  };

  // ── Finalize ────────────────────────────────────────────

  const handleFinalize = async () => {
    if (!session || !selectedGenerationId) return;
    if (!confirm("Lock this avatar as the official KOL identity? This will become the master reference for ALL future generations.")) {
      return;
    }

    setError(null);
    try {
      const res = await fetch("/api/kol-admin/avatar/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          kolId,
          generationId: selectedGenerationId,
          candidateIndex: selectedCandidateIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Finalize failed");

      setIsLocked(true);
      alert("Avatar đã được lock thành công!");
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Helpers ─────────────────────────────────────────────

  const selectedGeneration = generations.find((g) => g.id === selectedGenerationId);
  const previewUrl = selectedGeneration?.output_urls?.[selectedCandidateIndex];

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 text-sm">
          <div className="text-red-400 font-medium mb-1">Error:</div>
          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{error}</pre>
        </div>
      )}

      {isLocked && (
        <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-3 text-sm">
          🔒 <span className="text-green-400 font-medium">Avatar Locked</span> — This KOL has an official identity. New generations will branch from a new session.
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: References + History */}
        <div className="col-span-3 space-y-4">
          <ReferencesPanel
            references={references}
            uploading={uploading}
            onUpload={handleUpload}
            onRemove={handleRemoveReference}
          />
          <HistoryPanel
            generations={generations}
            selectedId={selectedGenerationId}
            onSelect={(id, idx) => handleSelectCandidate(id, idx)}
          />
        </div>

        {/* CENTER: Preview */}
        <div className="col-span-6">
          <PreviewPanel
            generation={selectedGeneration}
            candidateIndex={selectedCandidateIndex}
            previewUrl={previewUrl}
            onSelectCandidate={(idx) =>
              selectedGeneration && handleSelectCandidate(selectedGeneration.id, idx)
            }
          />
        </div>

        {/* RIGHT: Controls */}
        <div className="col-span-3 space-y-3">
          <ControlsPanel
            prompt={prompt}
            onPromptChange={setPrompt}
            candidateCount={candidateCount}
            onCandidateCountChange={setCandidateCount}
            generating={generating}
            isLocked={isLocked}
            hasParent={Boolean(selectedGenerationId && selectedGeneration?.status === "completed")}
            currentVersion={session?.current_version ?? 0}
            onGenerate={handleGenerate}
            onFinalize={handleFinalize}
            canFinalize={Boolean(selectedGenerationId && selectedGeneration?.status === "completed" && !isLocked)}
          />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════

function ReferencesPanel({
  references,
  uploading,
  onUpload,
  onRemove,
}: {
  references: AvatarReferenceImageRecord[];
  uploading: boolean;
  onUpload: (file: File, role: AvatarReferenceRole) => void;
  onRemove: (id: string, path: string) => void;
}) {
  const [role, setRole] = useState<AvatarReferenceRole>("face");
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach((f) => onUpload(f, role));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => onUpload(f, role));
    e.target.value = "";
  };

  return (
    <div className="border border-white/10 rounded-lg p-3 space-y-2">
      <div className="font-semibold text-sm">References ({references.length})</div>

      <div className="space-y-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AvatarReferenceRole)}
          className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-xs"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value} className="bg-gray-900">
              {r.label}
            </option>
          ))}
        </select>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`block border-2 border-dashed rounded p-3 text-center text-xs cursor-pointer transition-colors ${
            dragOver ? "border-blue-400 bg-blue-500/10" : "border-white/10 hover:border-white/30"
          }`}
        >
          {uploading ? "Uploading..." : "Drop images here or click"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {references.map((ref) => (
          <div
            key={ref.id}
            className="flex items-center gap-2 p-1.5 border border-white/10 rounded text-xs"
          >
            {ref.file_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ref.file_url}
                alt={ref.file_name}
                className="w-10 h-10 object-cover rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="truncate">{ref.file_name}</div>
              <div className="text-[10px] text-gray-500">{ref.role}</div>
            </div>
            <button
              onClick={() => onRemove(ref.id, ref.storage_path)}
              className="text-red-400 hover:text-red-300 px-1"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({
  generations,
  selectedId,
  onSelect,
}: {
  generations: AvatarGenerationRecord[];
  selectedId: string | null;
  onSelect: (id: string, candidateIndex: number) => void;
}) {
  return (
    <div className="border border-white/10 rounded-lg p-3 space-y-2">
      <div className="font-semibold text-sm">History ({generations.length})</div>
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {generations.length === 0 && (
          <div className="text-xs text-gray-500 italic p-2">No generations yet</div>
        )}
        {generations.map((g) => (
          <div
            key={g.id}
            className={`border rounded p-2 cursor-pointer text-xs transition-colors ${
              g.id === selectedId
                ? "border-blue-400 bg-blue-500/10"
                : "border-white/10 hover:bg-white/5"
            }`}
            onClick={() => g.output_urls.length > 0 && onSelect(g.id, g.selected_candidate_index ?? 0)}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono">v{g.version}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  g.status === "completed"
                    ? "bg-green-500/20 text-green-400"
                    : g.status === "failed"
                    ? "bg-red-500/20 text-red-400"
                    : g.status === "processing"
                    ? "bg-yellow-500/20 text-yellow-400 animate-pulse"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {g.status}
              </span>
            </div>
            <div className="text-gray-400 truncate mt-1">{g.prompt}</div>
            {g.output_urls.length > 0 && (
              <div className="flex gap-1 mt-1.5">
                {g.output_urls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className={`w-8 h-8 object-cover rounded cursor-pointer ${
                      g.id === selectedId && i === (g.selected_candidate_index ?? 0)
                        ? "ring-2 ring-blue-400"
                        : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(g.id, i);
                    }}
                  />
                ))}
              </div>
            )}
            {g.error_message && (
              <div className="text-red-400 text-[10px] mt-1 truncate">{g.error_message}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({
  generation,
  candidateIndex,
  previewUrl,
  onSelectCandidate,
}: {
  generation?: AvatarGenerationRecord;
  candidateIndex: number;
  previewUrl?: string;
  onSelectCandidate: (idx: number) => void;
}) {
  return (
    <div className="border border-white/10 rounded-lg p-3 space-y-3">
      <div className="font-semibold text-sm">
        Preview {generation && `— v${generation.version}`}
      </div>

      <div className="aspect-square bg-black/40 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-contain" />
        ) : (
          <div className="text-gray-500 text-sm text-center p-8">
            No avatar yet.
            <br />
            Upload references and write a prompt to generate.
          </div>
        )}
      </div>

      {generation && generation.output_urls.length > 1 && (
        <div>
          <div className="text-xs text-gray-400 mb-1.5">Candidates</div>
          <div className="grid grid-cols-4 gap-2">
            {generation.output_urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Candidate ${i + 1}`}
                className={`aspect-square object-cover rounded cursor-pointer transition-all ${
                  i === candidateIndex
                    ? "ring-2 ring-blue-400"
                    : "opacity-70 hover:opacity-100"
                }`}
                onClick={() => onSelectCandidate(i)}
              />
            ))}
          </div>
        </div>
      )}

      {generation && (
        <div className="text-xs text-gray-500 space-y-1 border-t border-white/10 pt-2">
          <div>Prompt: <span className="text-gray-300">{generation.prompt}</span></div>
          {generation.parent_generation_id && (
            <div>Branched from previous version</div>
          )}
          {generation.generation_time_ms && (
            <div>Generated in {(generation.generation_time_ms / 1000).toFixed(1)}s</div>
          )}
        </div>
      )}
    </div>
  );
}

function ControlsPanel({
  prompt,
  onPromptChange,
  candidateCount,
  onCandidateCountChange,
  generating,
  isLocked,
  hasParent,
  currentVersion,
  onGenerate,
  onFinalize,
  canFinalize,
}: {
  prompt: string;
  onPromptChange: (v: string) => void;
  candidateCount: number;
  onCandidateCountChange: (n: number) => void;
  generating: boolean;
  isLocked: boolean;
  hasParent: boolean;
  currentVersion: number;
  onGenerate: () => void;
  onFinalize: () => void;
  canFinalize: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="border border-white/10 rounded-lg p-3 space-y-2">
        <div className="font-semibold text-sm">Generation</div>
        <div className="text-xs text-gray-400">
          {hasParent
            ? `Iterating from v${currentVersion}. Add a prompt to refine.`
            : "Round 1 — describe the avatar you want."}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={6}
          placeholder={
            hasParent
              ? 'e.g. "Use the hairstyle from image B for the generated avatar."'
              : 'e.g. "Create a beautiful Vietnamese girl, early 20s, soft features, long black hair, professional photography."'
          }
          className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded text-xs"
          disabled={generating || isLocked}
        />

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Candidates:</span>
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => onCandidateCountChange(n)}
              className={`px-2 py-1 rounded ${
                candidateCount === n
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 hover:bg-white/10 text-gray-400"
              }`}
              disabled={generating || isLocked}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={onGenerate}
          disabled={generating || isLocked || prompt.trim().length < 3}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium"
        >
          {generating ? "Generating..." : "Generate"}
        </button>
      </div>

      <div className="border border-white/10 rounded-lg p-3 space-y-2">
        <div className="font-semibold text-sm">Finalize</div>
        <div className="text-xs text-gray-400">
          Lock the selected candidate as the official KOL avatar. This becomes
          the master reference for all future generations.
        </div>
        <button
          onClick={onFinalize}
          disabled={!canFinalize || isLocked}
          className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium"
        >
          {isLocked ? "🔒 Locked" : "Use As Official KOL Avatar"}
        </button>
      </div>
    </div>
  );
}
