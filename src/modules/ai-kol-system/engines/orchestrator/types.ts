import type { JsonData } from '../../types';

/**
 * Generation Orchestrator — Phase 10 Types
 * The central AI director that coordinates the entire pipeline.
 */

export type PipelineStage =
  | 'idle'
  | 'project_setup'
  | 'script_generation'
  | 'scene_planning'
  | 'prompt_injection'
  | 'image_generation'
  | 'asset_validation'
  | 'veo_prompt_building'
  | 'video_generation'
  | 'qa_validation'
  | 'auto_repair'
  | 'export'
  | 'completed'
  | 'failed';

export type PipelineJob = {
  id: string;
  campaignId: string;
  kolId: string;
  userId: string;
  currentStage: PipelineStage;
  stages: PipelineStageStatus[];
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
  result?: PipelineResult;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata: JsonData;
};

export type PipelineStageStatus = {
  stage: PipelineStage;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  output?: JsonData;
};

export type PipelineResult = {
  campaignId: string;
  scriptsGenerated: number;
  scenesCreated: number;
  imagesGenerated: number;
  videosGenerated: number;
  qaReports: number;
  repairsPerformed: number;
  totalDuration: number;
  exportUrl?: string;
};

export type PipelineConfig = {
  autoRepairEnabled: boolean;
  maxRepairAttempts: number;
  qaThresholdOverride?: number;
  skipImageGeneration: boolean;
  skipVideoGeneration: boolean;
  parallelScenes: number;
  notifyOnCompletion: boolean;
};

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  autoRepairEnabled: true,
  maxRepairAttempts: 2,
  skipImageGeneration: false,
  skipVideoGeneration: false,
  parallelScenes: 3,
  notifyOnCompletion: true,
};

export type OrchestratorEvent =
  | { type: 'pipeline.started'; jobId: string }
  | { type: 'pipeline.stage_changed'; jobId: string; stage: PipelineStage }
  | { type: 'pipeline.completed'; jobId: string; result: PipelineResult }
  | { type: 'pipeline.failed'; jobId: string; error: string }
  | { type: 'pipeline.paused'; jobId: string; reason: string };
