import type { JsonData } from '../../types';

/**
 * Video Generation Engine — Phase 6 Types
 * Veo 3 orchestration pipeline
 */

export type VideoGenerationMode =
  | 'single_scene'
  | 'multi_scene'
  | 'start_end_frame';

export type VideoGenerationInput = {
  kolId: string;
  campaignId: string;
  sceneId: string;
  promptId?: string;
  mode: VideoGenerationMode;
  prompt: string;
  settings: VideoGenerationSettings;
  referenceImages?: string[];
  startFrameUrl?: string;
  endFrameUrl?: string;
  metadata?: JsonData;
};

export type VideoGenerationSettings = {
  duration: number;
  fps: number;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  cinematicLevel: 'low' | 'medium' | 'high' | 'cinematic';
  motionIntensity: 'subtle' | 'moderate' | 'dynamic' | 'intense';
  resolution?: string;
};

export type VideoGenerationResult = {
  id: string;
  videoUrl: string;
  storagePath: string;
  duration: number;
  fps: number;
  resolution: string;
  provider: string;
  providerJobId: string;
  generationTime: number;
  metadata: JsonData;
};

export type VideoQueueJob = {
  id: string;
  kolId: string;
  campaignId: string;
  sceneId: string;
  mode: VideoGenerationMode;
  input: VideoGenerationInput;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  priority: number;
  providerJobId?: string;
  result?: VideoGenerationResult;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type VeoPromptStructure = {
  mainSubject: string;
  environment: string;
  action: string;
  cameraMovement: string;
  lighting: string;
  mood: string;
  realismLevel: string;
  productConsistency?: string;
  negativeInstructions: string;
  injectedLocks: string[];
};

export const DEFAULT_VIDEO_SETTINGS: VideoGenerationSettings = {
  duration: 6,
  fps: 24,
  quality: 'standard',
  aspectRatio: '9:16',
  cinematicLevel: 'high',
  motionIntensity: 'moderate',
};
