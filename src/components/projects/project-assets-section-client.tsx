"use client";

import { useEffect } from "react";
import { AssetManager } from "@/components/projects/asset-manager";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useAppDataStore } from "@/stores/app-data-store";

export function ProjectAssetsSectionClient({ projectId }: { projectId: string }) {
  const assetsState = useAppDataStore(
    (state) =>
      state.projectAssets[projectId] ?? {
        loaded: false,
        loading: false,
        data: [],
        error: null,
      },
  );
  const startLoading = useAppDataStore((state) => state.startProjectAssetsLoading);
  const setAssets = useAppDataStore((state) => state.setProjectAssets);
  const setError = useAppDataStore((state) => state.setProjectAssetsError);

  useEffect(() => {
    if (assetsState.loaded || assetsState.loading) {
      return;
    }

    startLoading(projectId);

    void fetch(`/api/projects/${projectId}/assets`)
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Không thể tải assets.");
        }

        setAssets(projectId, payload.assets);
      })
      .catch((error) => {
        setError(projectId, error instanceof Error ? error.message : "Không thể tải assets.");
      });
  }, [assetsState.loaded, assetsState.loading, projectId, setAssets, setError, startLoading]);

  if (assetsState.error) {
    return (
      <SurfaceCard>
        <p className="text-sm text-[var(--danger)]">{assetsState.error}</p>
      </SurfaceCard>
    );
  }

  if (!assetsState.loaded) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 animate-pulse">
        {Array.from({ length: 4 }).map((_, index) => (
          <SurfaceCard key={index}>
            <div className="h-6 w-40 rounded-full bg-[var(--surface-muted)]" />
            <div className="mt-4 h-12 rounded-[12px] bg-[var(--surface-muted)]" />
            <div className="mt-4 h-40 rounded-[16px] bg-[var(--surface-muted)]" />
          </SurfaceCard>
        ))}
      </div>
    );
  }

  return (
    <AssetManager
      projectId={projectId}
      initialAssets={assetsState.data}
      onAssetsChange={(assets) => setAssets(projectId, assets)}
    />
  );
}
