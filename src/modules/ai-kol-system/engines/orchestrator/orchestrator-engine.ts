import type { SupabaseClient } from '@supabase/supabase-js';
import { kolEventBus } from '../../events';
import { ScriptEngine } from '../script';
import { ImageEngine } from '../image';
import { VideoEngine } from '../video';
import { ConsistencyEngine } from '../consistency';
import { QaEngine } from '../qa';
import { CampaignService } from '../../services/campaign.service';
import { KolDnaService } from '../../services/kol-dna.service';
import type {
  PipelineJob,
  PipelineStage,
  PipelineStageStatus,
  PipelineConfig,
  PipelineResult,
} from './types';
import { DEFAULT_PIPELINE_CONFIG } from './types';

/**
 * Generation Orchestrator — Phase 10
 *
 * The central AI director that coordinates the entire
 * KOL video production pipeline:
 *
 * Idea → Project Setup → Script Engine → Scene Planner
 * → Prompt Injection → Image Generation → Asset Validation
 * → Veo Prompt Builder → Video Generation → QA Validation
 * → Auto Repair → Export
 *
 * This orchestrator:
 * - Manages queues
 * - Manages dependencies between stages
 * - Tracks generation states
 * - Retries failed jobs
 * - Optimizes generation flow
 * - Manages asset relationships
 */
export class OrchestratorEngine {
  private scriptEngine: ScriptEngine;
  private imageEngine: ImageEngine;
  private videoEngine: VideoEngine;
  private consistencyEngine: ConsistencyEngine;
  private qaEngine: QaEngine;
  private campaignService: CampaignService;
  private dnaService: KolDnaService;
  private config: PipelineConfig;

  constructor(db: SupabaseClient, config?: Partial<PipelineConfig>) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.scriptEngine = new ScriptEngine(db);
    this.imageEngine = new ImageEngine(db);
    this.videoEngine = new VideoEngine(db);
    this.consistencyEngine = new ConsistencyEngine(db);
    this.qaEngine = new QaEngine(db);
    this.campaignService = new CampaignService(db);
    this.dnaService = new KolDnaService(db);
  }

  /**
   * Create a new pipeline job.
   */
  createPipelineJob(
    campaignId: string,
    kolId: string,
    userId: string,
    priority: number = 0
  ): PipelineJob {
    const stages: PipelineStage[] = [
      'project_setup',
      'script_generation',
      'scene_planning',
      'prompt_injection',
      ...(this.config.skipImageGeneration ? [] : ['image_generation' as PipelineStage]),
      ...(this.config.skipImageGeneration ? [] : ['asset_validation' as PipelineStage]),
      'veo_prompt_building',
      ...(this.config.skipVideoGeneration ? [] : ['video_generation' as PipelineStage]),
      'qa_validation',
      ...(this.config.autoRepairEnabled ? ['auto_repair' as PipelineStage] : []),
      'export',
    ];

    return {
      id: crypto.randomUUID(),
      campaignId,
      kolId,
      userId,
      currentStage: 'idle',
      stages: stages.map((stage) => ({
        stage,
        status: 'pending',
      })),
      status: 'queued',
      priority,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      metadata: {},
    };
  }

  /**
   * Advance pipeline to next stage.
   */
  advanceStage(job: PipelineJob): PipelineJob {
    const currentIndex = job.stages.findIndex((s) => s.stage === job.currentStage);
    const nextIndex = currentIndex + 1;

    if (nextIndex >= job.stages.length) {
      return {
        ...job,
        currentStage: 'completed',
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
    }

    const nextStage = job.stages[nextIndex];

    // Mark current as completed
    if (currentIndex >= 0) {
      job.stages[currentIndex] = {
        ...job.stages[currentIndex],
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
    }

    // Mark next as running
    job.stages[nextIndex] = {
      ...nextStage,
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    return {
      ...job,
      currentStage: nextStage.stage,
      status: 'running',
    };
  }

  /**
   * Mark current stage as failed.
   */
  failStage(job: PipelineJob, error: string): PipelineJob {
    const currentIndex = job.stages.findIndex((s) => s.stage === job.currentStage);

    if (currentIndex >= 0) {
      job.stages[currentIndex] = {
        ...job.stages[currentIndex],
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      };
    }

    // Check if we can retry
    if (job.retryCount < job.maxRetries) {
      return {
        ...job,
        retryCount: job.retryCount + 1,
        error,
      };
    }

    return {
      ...job,
      status: 'failed',
      error,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Execute the script generation stage.
   */
  async executeScriptGeneration(job: PipelineJob): Promise<PipelineStageStatus> {
    const stage: PipelineStageStatus = {
      stage: 'script_generation',
      status: 'running',
      startedAt: new Date().toISOString(),
    };

    try {
      const context = await this.scriptEngine.prepareGenerationContext({
        kolId: job.kolId,
        campaignId: job.campaignId,
        product: '',
        idea: '',
        platform: '',
        videoDuration: 30,
        hookStyle: 'curiosity',
        ctaGoal: 'engagement',
        contentType: 'commercial',
      });

      stage.status = 'completed';
      stage.completedAt = new Date().toISOString();
      stage.output = { context: 'prepared', sceneCount: context.sceneSkeleton.length };
    } catch (error) {
      stage.status = 'failed';
      stage.error = error instanceof Error ? error.message : 'Unknown error';
      stage.completedAt = new Date().toISOString();
    }

    return stage;
  }

  /**
   * Execute the consistency injection stage.
   */
  async executePromptInjection(job: PipelineJob, prompts: string[]): Promise<string[]> {
    const transformedPrompts: string[] = [];

    for (const prompt of prompts) {
      const result = await this.consistencyEngine.transformPrompt(job.kolId, prompt);
      transformedPrompts.push(result.transformedPrompt);
    }

    return transformedPrompts;
  }

  /**
   * Execute QA validation stage.
   */
  async executeQaValidation(job: PipelineJob, videoId: string, scores: import('../qa/types').QaScore[]): Promise<import('../qa/types').QaReport> {
    return this.qaEngine.validate(job.campaignId, videoId, scores, job.userId);
  }

  /**
   * Get pipeline progress as percentage.
   */
  getProgress(job: PipelineJob): number {
    const completed = job.stages.filter((s) => s.status === 'completed').length;
    return Math.round((completed / job.stages.length) * 100);
  }

  /**
   * Get estimated time remaining (rough estimate).
   */
  getEstimatedTimeRemaining(job: PipelineJob): number {
    const completed = job.stages.filter((s) => s.status === 'completed');
    if (completed.length === 0) return 0;

    // Calculate average stage duration
    const durations = completed
      .filter((s) => s.startedAt && s.completedAt)
      .map((s) => new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime());

    if (durations.length === 0) return 0;

    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const remaining = job.stages.filter((s) => s.status === 'pending').length;

    return Math.round(avgDuration * remaining / 1000); // seconds
  }

  /**
   * Get current pipeline configuration.
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  /**
   * Update pipeline configuration.
   */
  updateConfig(updates: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
