"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Focus,
  ScanSearch,
  Square,
} from "lucide-react";
import {
  CAMERA_ANGLE_OPTIONS,
  type CameraAngle,
} from "@/lib/ai/camera-angle";

const iconMap: Record<CameraAngle, ComponentType<{ className?: string }>> = {
  center: Square,
  left: ArrowLeft,
  right: ArrowRight,
  high: ArrowUp,
  low: ArrowDown,
  close: Focus,
  far: ScanSearch,
};

export function CameraAngleSelector({
  value,
  onChange,
}: {
  value: CameraAngle;
  onChange: (value: CameraAngle) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = useMemo(
    () => CAMERA_ANGLE_OPTIONS.find((option) => option.id === value) ?? CAMERA_ANGLE_OPTIONS[0],
    [value],
  );
  const SelectedIcon = iconMap[selectedOption.id];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <SelectedIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Góc máy</p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">
              {selectedOption.label}: {selectedOption.promptHint}
            </p>
          </div>
        </div>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div className="border-t border-[var(--border)] px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {CAMERA_ANGLE_OPTIONS.map((option) => {
              const Icon = iconMap[option.id];
              const active = option.id === value;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={[
                    "flex min-h-24 flex-col items-start justify-between rounded-2xl border px-4 py-4 text-left transition",
                    active
                      ? "border-[var(--foreground)] bg-[var(--surface)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl border",
                      active
                        ? "border-[var(--foreground)] bg-[var(--foreground)]/10"
                        : "border-[var(--border)]",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="mt-1 text-xs leading-5">{option.promptHint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
