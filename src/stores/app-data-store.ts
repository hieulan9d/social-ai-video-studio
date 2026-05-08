"use client";

import { create } from "zustand";
import type { QuickGenerationRecord } from "@/lib/ai/quick-generations";
import type { AnalyticsDashboardSummary } from "@/lib/analytics/dashboard";
import type { ProjectAssetRecord } from "@/lib/projects/types";
import type { AuthUserProfile } from "@/lib/auth/types";
import type { Project } from "@/lib/projects/types";

type CachedResource<T> = {
  loaded: boolean;
  loading: boolean;
  data: T;
  error: string | null;
};

type ShellState = {
  user: AuthUserProfile | null;
  credits: number;
};

type AppDataStore = {
  shell: ShellState;
  projects: CachedResource<Project[]>;
  quickHistory: CachedResource<QuickGenerationRecord[]>;
  analytics: CachedResource<AnalyticsDashboardSummary | null>;
  projectAssets: Record<string, CachedResource<ProjectAssetRecord[]>>;
  setShell: (payload: ShellState) => void;
  startLoading: (key: "projects" | "quickHistory" | "analytics") => void;
  startProjectAssetsLoading: (projectId: string) => void;
  setProjects: (projects: Project[]) => void;
  setQuickHistory: (generations: QuickGenerationRecord[]) => void;
  setAnalytics: (summary: AnalyticsDashboardSummary) => void;
  setProjectAssets: (projectId: string, assets: ProjectAssetRecord[]) => void;
  setError: (key: "projects" | "quickHistory" | "analytics", error: string) => void;
  setProjectAssetsError: (projectId: string, error: string) => void;
};

function createCachedResource<T>(data: T): CachedResource<T> {
  return {
    loaded: false,
    loading: false,
    data,
    error: null,
  };
}

export const useAppDataStore = create<AppDataStore>((set) => ({
  shell: {
    user: null,
    credits: 0,
  },
  projects: createCachedResource<Project[]>([]),
  quickHistory: createCachedResource<QuickGenerationRecord[]>([]),
  analytics: createCachedResource<AnalyticsDashboardSummary | null>(null),
  projectAssets: {},
  setShell: (payload) =>
    set((state) => {
      if (
        state.shell.user?.id === payload.user?.id &&
        state.shell.credits === payload.credits
      ) {
        return state;
      }

      return {
        shell: payload,
      };
    }),
  startLoading: (key) =>
    set((state) => ({
      [key]: {
        ...state[key],
        loading: true,
        error: null,
      },
    })),
  startProjectAssetsLoading: (projectId) =>
    set((state) => ({
      projectAssets: {
        ...state.projectAssets,
        [projectId]: {
          ...(state.projectAssets[projectId] ?? createCachedResource<ProjectAssetRecord[]>([])),
          loading: true,
          error: null,
        },
      },
    })),
  setProjects: (projects) =>
    set(() => ({
      projects: {
        loaded: true,
        loading: false,
        data: projects,
        error: null,
      },
    })),
  setQuickHistory: (generations) =>
    set(() => ({
      quickHistory: {
        loaded: true,
        loading: false,
        data: generations,
        error: null,
      },
    })),
  setAnalytics: (summary) =>
    set(() => ({
      analytics: {
        loaded: true,
        loading: false,
        data: summary,
        error: null,
      },
    })),
  setProjectAssets: (projectId, assets) =>
    set((state) => ({
      projectAssets: {
        ...state.projectAssets,
        [projectId]: {
          loaded: true,
          loading: false,
          data: assets,
          error: null,
        },
      },
    })),
  setError: (key, error) =>
    set((state) => ({
      [key]: {
        ...state[key],
        loading: false,
        error,
      },
    })),
  setProjectAssetsError: (projectId, error) =>
    set((state) => ({
      projectAssets: {
        ...state.projectAssets,
        [projectId]: {
          ...(state.projectAssets[projectId] ?? createCachedResource<ProjectAssetRecord[]>([])),
          loading: false,
          error,
        },
      },
    })),
}));
