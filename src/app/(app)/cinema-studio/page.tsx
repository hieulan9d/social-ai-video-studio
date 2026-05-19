"use client";

import { useState } from "react";
import { Film, ImageIcon } from "lucide-react";
import { CinemaStudioWorkspace } from "@/components/cinema/cinema-studio-workspace";
import { CinemaFrameTransition } from "@/components/cinema/cinema-frame-transition";

type CinemaMode = "production" | "frame-transition";

export default function CinemaStudioPage() {
  const [mode, setMode] = useState<CinemaMode>("production");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--muted)]">Cinema Studio</p>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.03em] text-[var(--heading)]">
          Cinema Studio
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Tạo video chất lượng TVC/brand film với multi-take rendering và timeline editing.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("production")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            mode === "production"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <Film className="h-4 w-4" />
          Production
        </button>
        <button
          type="button"
          onClick={() => setMode("frame-transition")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
            mode === "frame-transition"
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Start/End Frame
        </button>
      </div>

      {/* Content */}
      {mode === "production" && <CinemaStudioWorkspace />}
      {mode === "frame-transition" && <CinemaFrameTransition />}
    </div>
  );
}
