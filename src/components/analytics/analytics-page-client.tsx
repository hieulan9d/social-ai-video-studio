"use client";

import { useEffect } from "react";
import { BarChart3, Coins, Layers3, Sparkles, Workflow } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useAppDataStore } from "@/stores/app-data-store";

export function AnalyticsPageClient() {
  const analyticsState = useAppDataStore((state) => state.analytics);
  const startLoading = useAppDataStore((state) => state.startLoading);
  const setAnalytics = useAppDataStore((state) => state.setAnalytics);
  const setError = useAppDataStore((state) => state.setError);

  useEffect(() => {
    if (analyticsState.loaded || analyticsState.loading) {
      return;
    }

    startLoading("analytics");

    void fetch("/api/analytics/summary")
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Khong the tai analytics.");
        }

        setAnalytics(payload.summary);
      })
      .catch((error) => {
        setError("analytics", error instanceof Error ? error.message : "Khong the tai analytics.");
      });
  }, [analyticsState.loaded, analyticsState.loading, setAnalytics, setError, startLoading]);

  if (analyticsState.error) {
    return (
      <SurfaceCard>
        <p className="text-sm text-[var(--danger)]">{analyticsState.error}</p>
      </SurfaceCard>
    );
  }

  if (!analyticsState.loaded || !analyticsState.data) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-[var(--surface-muted)]" />
          <div className="h-10 w-80 rounded-[12px] bg-[var(--surface-muted)]" />
          <div className="h-4 w-full max-w-3xl rounded-full bg-[var(--surface-muted)]" />
        </div>
        <div className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SurfaceCard key={index} className="p-[14px]">
              <div className="h-4 w-24 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-4 h-8 w-20 rounded-[10px] bg-[var(--surface-muted)]" />
              <div className="mt-2 h-3 w-32 rounded-full bg-[var(--surface-muted)]" />
            </SurfaceCard>
          ))}
        </div>
      </div>
    );
  }

  const summary = analyticsState.data;
  const maxChartValue = Math.max(
    1,
    ...summary.outputsByDay.map((item) => item.image + item.video + item.prompt),
  );
  const maxUsageValue = Math.max(1, ...summary.usageByFeature.map((item) => item.value));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics"
        title="Phan tich su dung"
        description="Theo doi nhip tao anh, video, prompt, credits va hoat dong gan day trong studio AI cua ban."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {summary.stats.map((item, index) => (
          <SurfaceCard key={item.label} className="p-[14px]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--muted)]">
                {item.label}
              </p>
              <StatIcon index={index} />
            </div>
            <p className="mt-4 text-[22px] font-medium text-[var(--foreground)]">{item.value}</p>
            <p className="mt-2 text-[10px] text-[var(--muted-foreground)]">{item.note}</p>
          </SurfaceCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard className="rounded-[var(--radius-shell)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Nhip tao noi dung</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {summary.windowLabel} · tong quan anh, video va prompt theo ngay.
              </p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              7 ngay
            </span>
          </div>

          <div className="mt-6 grid h-[260px] grid-cols-7 items-end gap-3">
            {summary.outputsByDay.map((item) => {
              const total = item.image + item.video + item.prompt;
              return (
                <div key={item.label} className="flex h-full flex-col justify-end gap-3">
                  <div className="flex h-full items-end justify-center gap-1 rounded-[12px] border bg-[var(--surface-muted)] px-2 py-3">
                    <div
                      className="w-3 rounded-full bg-[#2dd4bf]"
                      style={{ height: total > 0 ? `${Math.max(8, (item.image / maxChartValue) * 100)}%` : "8%" }}
                    />
                    <div
                      className="w-3 rounded-full bg-[#60a5fa]"
                      style={{ height: total > 0 ? `${Math.max(8, (item.video / maxChartValue) * 100)}%` : "8%" }}
                    />
                    <div
                      className="w-3 rounded-full bg-[#a78bfa]"
                      style={{ height: total > 0 ? `${Math.max(8, (item.prompt / maxChartValue) * 100)}%` : "8%" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-[var(--foreground)]">{total}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                      {item.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[var(--radius-shell)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Tieu thu credits</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Chuc nang nao dang dung nhieu credits nhat trong tai khoan nay.
              </p>
            </div>
            <Coins className="h-5 w-5 text-[var(--highlight)]" />
          </div>

          <div className="mt-6 space-y-4">
            {summary.usageByFeature.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--foreground)]">{item.label}</span>
                  <span className="text-[var(--muted-foreground)]">
                    {item.value.toLocaleString("vi-VN")} credits
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-muted)]">
                  <div
                    className={`h-2 rounded-full ${item.tone}`}
                    style={{
                      width: `${Math.max(8, (item.value / maxUsageValue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <SurfaceCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Ha tang AI dang dung</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Tong hop theo provider va model xuat hien trong cac job gan day.
              </p>
            </div>
            <Workflow className="h-5 w-5 text-[var(--highlight)]" />
          </div>

          <div className="mt-5 grid gap-3">
            {summary.providerUsage.map((item) => (
              <div key={item.label} className="rounded-[12px] border bg-[var(--surface-muted)] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-[var(--heading)]">{item.label}</p>
                  <span className="text-sm text-[var(--foreground)]">
                    {item.value.toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted-foreground)]">{item.note}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium text-[var(--heading)]">Model dung nhieu nhat</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Top model xuat hien trong quick generations gan day.
              </p>
            </div>
            <Layers3 className="h-5 w-5 text-[var(--highlight)]" />
          </div>

          <div className="mt-5 space-y-3">
            {summary.modelUsage.map((item, index) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--heading)]">{item.label}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Hang {index + 1} trong 30 ngay gan day
                  </p>
                </div>
                <span className="text-sm text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="rounded-[var(--radius-shell)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-[var(--heading)]">Hoat dong gan day</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Gop nhanh job tao noi dung, render du an va bien dong credits.
            </p>
          </div>
          <BarChart3 className="h-5 w-5 text-[var(--highlight)]" />
        </div>

        <div className="mt-5 space-y-3">
          {summary.activity.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-[12px] border bg-[var(--surface-muted)] px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full ${getActivityDotClass(item.status)}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--heading)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{item.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <span className={getStatusClass(item.status)}>{formatStatus(item.status)}</span>
                <span className="text-xs text-[var(--muted)]">
                  {new Date(item.createdAt).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function StatIcon({ index }: { index: number }) {
  const icons = [
    <Sparkles key="sparkles" className="h-4 w-4 text-[var(--highlight)]" />,
    <Workflow key="workflow" className="h-4 w-4 text-[var(--highlight)]" />,
    <Coins key="coins" className="h-4 w-4 text-[var(--highlight)]" />,
    <BarChart3 key="chart" className="h-4 w-4 text-[var(--highlight)]" />,
  ];

  return icons[index] ?? icons[0];
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    queued: "Cho hang",
    processing: "Dang xu ly",
    completed: "Hoan thanh",
    failed: "Loi",
    success: "Hoan thanh",
    pending: "Cho hang",
  };

  return labels[status] ?? status;
}

function getStatusClass(status: string) {
  const base = "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]";

  if (status === "completed" || status === "success") {
    return `${base} border-[rgba(34,197,94,0.35)] text-[var(--success)]`;
  }

  if (status === "processing") {
    return `${base} border-[rgba(59,130,246,0.35)] text-[var(--processing)]`;
  }

  if (status === "queued" || status === "pending") {
    return `${base} border-[rgba(245,158,11,0.35)] text-[var(--pending)]`;
  }

  return `${base} border-[rgba(248,113,113,0.35)] text-[var(--danger)]`;
}

function getActivityDotClass(status: string) {
  if (status === "completed" || status === "success") return "bg-[var(--success)]";
  if (status === "processing") return "bg-[var(--processing)]";
  if (status === "queued" || status === "pending") return "bg-[var(--pending)]";
  return "bg-[var(--danger)]";
}
