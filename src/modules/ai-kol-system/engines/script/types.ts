import type { JsonData } from '../../types';

/**
 * Script Engine — Phase 4 Types
 * AI Script Generation for KOL video production
 */

export type ScriptGenerationInput = {
  kolId: string;
  campaignId: string;
  product: string;
  idea: string;
  platform: string;
  videoDuration: number;
  hookStyle: string;
  ctaGoal: string;
  contentType: string;
  language?: string;
  emotionCurve?: string;
  additionalContext?: JsonData;
};

export type GeneratedScript = {
  title: string;
  hook: string;
  targetAudience: string;
  problem: string;
  solution: string;
  productSection: string;
  cta: string;
  voiceover: string;
  scenes: GeneratedScene[];
  metadata: ScriptMetadata;
};

export type GeneratedScene = {
  scene: number;
  duration: string;
  visualPrompt: string;
  voiceOverVi: string;
  camera: string;
  transition: string;
  negativePrompt: string;
  sceneData: JsonData;
};

export type ScriptMetadata = {
  totalDuration: number;
  sceneCount: number;
  platform: string;
  contentType: string;
  generatedAt: string;
  provider: string;
  model: string;
};

export type HookStyle =
  | 'question'
  | 'shock'
  | 'story'
  | 'statistic'
  | 'pain_point'
  | 'curiosity'
  | 'controversy'
  | 'transformation';

export type CtaStyle =
  | 'direct'
  | 'urgency'
  | 'social_proof'
  | 'benefit'
  | 'scarcity'
  | 'emotional'
  | 'educational';

export type EmotionCurve =
  | 'rising'
  | 'falling'
  | 'wave'
  | 'peak_middle'
  | 'peak_end'
  | 'steady_high';

export type ScriptEngineConfig = {
  maxSceneDuration: number;
  minSceneDuration: number;
  defaultLanguage: string;
  enableNegativePrompts: boolean;
  enableConsistencyInjection: boolean;
};

export const DEFAULT_SCRIPT_ENGINE_CONFIG: ScriptEngineConfig = {
  maxSceneDuration: 8,
  minSceneDuration: 4,
  defaultLanguage: 'vi',
  enableNegativePrompts: true,
  enableConsistencyInjection: true,
};
