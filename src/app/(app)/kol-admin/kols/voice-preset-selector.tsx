"use client";

import { useState, useRef, useCallback } from "react";

const VOICE_PRESETS = [
  { id: "Kestrel", label: "Kestrel (Nữ, trẻ, năng động)" },
  { id: "Puck", label: "Puck (Nam, trẻ, thân thiện)" },
  { id: "Charon", label: "Charon (Nam, trầm, uy tín)" },
  { id: "Fenrir", label: "Fenrir (Nam, mạnh mẽ)" },
  { id: "Leda", label: "Leda (Nữ, nhẹ nhàng, ấm áp)" },
  { id: "Orus", label: "Orus (Nam, chuyên nghiệp)" },
  { id: "Zephyr", label: "Zephyr (Nữ, tự tin)" },
  { id: "Aoede", label: "Aoede (Nữ, sang trọng)" },
];

export function VoicePresetSelector({
  kolId,
  currentPreset,
}: {
  kolId: string;
  currentPreset: string | null;
}) {
  const [preset, setPreset] = useState(currentPreset || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePreset = useCallback(async (value: string) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/kol-admin/kol/voice-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kolId, voicePreset: value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // best effort
    } finally {
      setSaving(false);
    }
  }, [kolId]);

  const handleChange = (value: string) => {
    setPreset(value);
    // Debounce: cancel previous timer, wait 500ms before saving
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => savePreset(value), 500);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={preset}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px]"
      >
        <option value="" className="bg-gray-900">-- Chọn giọng --</option>
        {VOICE_PRESETS.map((v) => (
          <option key={v.id} value={v.id} className="bg-gray-900">
            {v.label}
          </option>
        ))}
      </select>
      {saving && <span className="text-[9px] text-gray-400">Đang lưu...</span>}
      {saved && <span className="text-[9px] text-green-400">✓ Đã lưu</span>}
      {preset && !saving && !saved && (
        <span className="text-[9px] text-gray-500">🎙 {preset}</span>
      )}
    </div>
  );
}
