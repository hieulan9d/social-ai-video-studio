"use client";

import { useEffect, useMemo } from "react";
import { QuickHistoryList } from "@/components/quick-create/quick-history-list";
import { QuickStudioNav } from "@/components/quick-create/quick-studio-nav";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useAppDataStore } from "@/stores/app-data-store";

export function QuickHistoryPageClient() {
  const projectsState = useAppDataStore((state) => state.projects);
  const quickHistoryState = useAppDataStore((state) => state.quickHistory);
  const startLoading = useAppDataStore((state) => state.startLoading);
  const setProjects = useAppDataStore((state) => state.setProjects);
  const setQuickHistory = useAppDataStore((state) => state.setQuickHistory);
  const setError = useAppDataStore((state) => state.setError);

  useEffect(() => {
    if (!projectsState.loaded && !projectsState.loading) {
      startLoading("projects");
      void fetch("/api/projects")
        .then(async (response) => {
          const payload = await response.json();

          if (!response.ok || !payload.ok) {
            throw new Error(payload.error ?? "Không thể tải dự án.");
          }

          setProjects(payload.projects);
        })
        .catch((error) => {
          setError("projects", error instanceof Error ? error.message : "Không thể tải dự án.");
        });
    }

    if (!quickHistoryState.loaded && !quickHistoryState.loading) {
      startLoading("quickHistory");
      void fetch("/api/quick-generations")
        .then(async (response) => {
          const payload = await response.json();

          if (!response.ok || !payload.ok) {
            throw new Error(payload.error ?? "Không thể tải lịch sử.");
          }

          setQuickHistory(payload.generations);
        })
        .catch((error) => {
          setError(
            "quickHistory",
            error instanceof Error ? error.message : "Không thể tải lịch sử.",
          );
        });
    }
  }, [
    projectsState.loaded,
    projectsState.loading,
    quickHistoryState.loaded,
    quickHistoryState.loading,
    setError,
    setProjects,
    setQuickHistory,
    startLoading,
  ]);

  const loading = useMemo(
    () =>
      (!projectsState.loaded && projectsState.loading) ||
      (!quickHistoryState.loaded && quickHistoryState.loading),
    [
      projectsState.loaded,
      projectsState.loading,
      quickHistoryState.loaded,
      quickHistoryState.loading,
    ],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted-foreground)]">
            AI Studio nhanh
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">History</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)]">
            Quản lý toàn bộ ảnh, video và prompt đã tạo nhanh.
          </p>
        </div>
        <QuickStudioNav active="history" />
      </div>

      {projectsState.error || quickHistoryState.error ? (
        <SurfaceCard>
          <p className="text-sm text-[var(--danger)]">
            {projectsState.error ?? quickHistoryState.error}
          </p>
        </SurfaceCard>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SurfaceCard key={index} className="animate-pulse">
              <div className="h-48 rounded-[16px] bg-[var(--surface-muted)]" />
              <div className="mt-4 h-4 w-40 rounded-full bg-[var(--surface-muted)]" />
              <div className="mt-3 h-12 rounded-[12px] bg-[var(--surface-muted)]" />
            </SurfaceCard>
          ))}
        </div>
      ) : (
        <QuickHistoryList
          initialGenerations={quickHistoryState.data}
          projects={projectsState.data}
        />
      )}
    </div>
  );
}
