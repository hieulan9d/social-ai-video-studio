"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Coins, RefreshCcw } from "lucide-react";
import type { SmartRoutingSettings } from "@/lib/ai/smart-routing";
import { saveSmartRoutingSettingsAction } from "@/lib/ai/smart-routing-actions";

export function SmartRoutingSettingsCard({
  initialSettings,
  canEdit,
}: {
  initialSettings: SmartRoutingSettings;
  canEdit: boolean;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(
    next:
      | Partial<SmartRoutingSettings>
      | ((current: SmartRoutingSettings) => Partial<SmartRoutingSettings>),
  ) {
    setSettings((current) => {
      const patch = typeof next === "function" ? next(current) : next;
      const merged = { ...current, ...patch };

      if (merged.preferCheapest) {
        merged.preferFastest = false;
      }

      if (merged.preferFastest) {
        merged.preferCheapest = false;
      }

      if (!merged.dailyCreditLimitEnabled) {
        merged.dailyCreditLimit = null;
      }

      if (!merged.perUserCreditLimitEnabled) {
        merged.perUserCreditLimit = null;
      }

      return merged;
    });
  }

  function save() {
    if (!canEdit) {
      return;
    }

    startTransition(async () => {
      setMessage(null);
      setError(null);

      try {
        const result = await saveSmartRoutingSettingsAction({
          preferCheapest: settings.preferCheapest,
          preferFastest: settings.preferFastest,
          autoFallbackOnError: settings.autoFallbackOnError,
          dailyCreditLimitEnabled: settings.dailyCreditLimitEnabled,
          dailyCreditLimit: settings.dailyCreditLimit,
          perUserCreditLimitEnabled: settings.perUserCreditLimitEnabled,
          perUserCreditLimit: settings.perUserCreditLimit,
        });

        setSettings(result.settings);
        setMessage("Đã lưu cấu hình Smart routing.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Không thể lưu cấu hình.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ToggleCard
          label="Auto chọn model rẻ nhất"
          description="Ưu tiên model có chi phí thấp nhất."
          checked={settings.preferCheapest}
          disabled={!canEdit}
          icon={Coins}
          onToggle={() => update((current) => ({ preferCheapest: !current.preferCheapest }))}
        />
        <ToggleCard
          label="Auto chọn model nhanh nhất"
          description="Ưu tiên model phản hồi nhanh nhất."
          checked={settings.preferFastest}
          disabled={!canEdit}
          icon={CheckCircle2}
          onToggle={() => update((current) => ({ preferFastest: !current.preferFastest }))}
        />
        <ToggleCard
          label="Auto fallback khi lỗi"
          description="Tự retry bằng model thay thế khi model đầu lỗi."
          checked={settings.autoFallbackOnError}
          disabled={!canEdit}
          icon={RefreshCcw}
          onToggle={() =>
            update((current) => ({ autoFallbackOnError: !current.autoFallbackOnError }))
          }
        />
        <ToggleCard
          label="Giới hạn credits / ngày"
          description="Giới hạn tổng credits toàn hệ thống trong ngày."
          checked={settings.dailyCreditLimitEnabled}
          disabled={!canEdit}
          icon={Coins}
          onToggle={() =>
            update((current) => ({
              dailyCreditLimitEnabled: !current.dailyCreditLimitEnabled,
              dailyCreditLimit: current.dailyCreditLimit ?? 100,
            }))
          }
        />
        <ToggleCard
          label="Giới hạn credits / user"
          description="Giới hạn credits mỗi user được dùng trong ngày."
          checked={settings.perUserCreditLimitEnabled}
          disabled={!canEdit}
          icon={Coins}
          onToggle={() =>
            update((current) => ({
              perUserCreditLimitEnabled: !current.perUserCreditLimitEnabled,
              perUserCreditLimit: current.perUserCreditLimit ?? 25,
            }))
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <NumberField
          label="Tổng credits mỗi ngày"
          value={settings.dailyCreditLimit ?? ""}
          placeholder="Ví dụ: 500"
          disabled={!canEdit || !settings.dailyCreditLimitEnabled}
          onChange={(value) => update({ dailyCreditLimit: value })}
        />
        <NumberField
          label="Credits mỗi user / ngày"
          value={settings.perUserCreditLimit ?? ""}
          placeholder="Ví dụ: 50"
          disabled={!canEdit || !settings.perUserCreditLimitEnabled}
          onChange={(value) => update({ perUserCreditLimit: value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canEdit || pending}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-[8px] bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Lưu Smart routing"}
        </button>
        {!canEdit ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Chỉ tài khoản admin mới được thay đổi cấu hình này.
          </p>
        ) : null}
      </div>

      {message ? (
        <div className="rounded-[12px] border border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.08)] px-4 py-3 text-sm text-[var(--success)]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[12px] border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function ToggleCard({
  label,
  description,
  checked,
  disabled,
  icon: Icon,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-4 text-left disabled:opacity-60"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--highlight)]">
          <Icon className="h-4 w-4" />
        </div>
        <div
          className={[
            "flex h-6 w-11 rounded-full border p-1 transition",
            checked
              ? "justify-end border-[rgba(96,165,250,0.4)] bg-[#19335f]"
              : "justify-start border-[var(--border-strong)] bg-[#111c35]",
          ].join(" ")}
        >
          <div className="h-4 w-4 rounded-full bg-[var(--highlight)]" />
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{description}</p>
    </button>
  );
}

function NumberField({
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: number | "";
  placeholder: string;
  disabled: boolean;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">{label}</p>
      <input
        type="number"
        min={0}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => {
          const rawValue = event.target.value.trim();
          onChange(rawValue ? Number.parseInt(rawValue, 10) : null);
        }}
        className="mt-3 w-full bg-transparent text-sm text-[var(--foreground)] outline-none disabled:opacity-60"
      />
    </label>
  );
}
