"use client";

import { useState } from "react";

export function ShowMigrationButton({ sql, label = "SQL migration" }: { sql: string; label?: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback handled by select textarea
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => setShown(!shown)}
          className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 rounded text-xs"
        >
          {shown ? `Ẩn ${label}` : `Hiển thị ${label}`}
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-xs"
        >
          {copied ? "✓ Đã copy" : "Copy SQL vào clipboard"}
        </button>
      </div>
      {shown && (
        <textarea
          readOnly
          value={sql}
          rows={20}
          className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-xs font-mono"
          onFocus={(e) => e.target.select()}
        />
      )}
    </div>
  );
}
