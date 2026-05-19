import type { SupabaseClient } from '@supabase/supabase-js';
import { KolDnaService } from '../../services/kol-dna.service';
import { PromptMemoryService } from '../../services/prompt-memory.service';
import { PromptInjectionEngine } from '../script/prompt-injection';
import { kolEventBus } from '../../events';
import type {
  VideoGenerationInput,
  VideoQueueJob,
  VeoPromptStructure,
  VideoGenerationSettings,
} from './types';
import { DEFAULT_VIDEO_SETTINGS } from './types';
import type { JsonData, PromptInjectionContext } from '../../types';

/**
 * Video Generation Engine — Phase 6
 *
 * Orchestrates Veo 3 video generation:
 * - Single scene generation
 * - Multi-scene workflow
 * - Start/end frame workflow
 * - Consistency injection
 * - Queue management
 * - Retry system
 *
 * IMPORTANT: Every scene is self-contained.
 * Veo cannot rely on previous scene memory.
 */
export class VideoEngine {
  private dnaService: KolDnaService;
  private memoryService: PromptMemoryService;
  private injectionEngine: PromptInjectionEngine;

  constructor(private db: SupabaseClient) {
    this.dnaService = new KolDnaService(db);
    this.memoryService = new PromptMemoryService(db);
    this.injectionEngine = new PromptInjectionEngine();
  }

  /**
   * Build a Veo-ready prompt from structured scene data.
   * Injects all consistency locks automatically.
   */
  async buildVeoPrompt(
    kolId: string,
    sceneData: JsonData,
    settings: VideoGenerationSettings = DEFAULT_VIDEO_SETTINGS
  ): Promise<VeoPromptStructure> {
    // Load injection context
    const injectionContext = await this.memoryService.buildInjectionContext(kolId);

    // Build base prompt structure
    const structure: VeoPromptStructure = {
      mainSubject: String(sceneData.subject_action || sceneData.visual_prompt || ''),
      environment: String(sceneData.background || sceneData.environment || ''),
      action: String(sceneData.subject_action || ''),
      cameraMovement: String(sceneData.camera_movement || sceneData.camera || ''),
      lighting: String(sceneData.lighting || 'natural'),
      mood: String(sceneData.mood || 'professional'),
      realismLevel: settings.cinematicLevel === 'cinematic' ? 'hyperrealistic' : 'realistic',
      negativeInstructions: '',
      injectedLocks: [],
    };

    // Inject consistency locks
    const injection = this.injectionEngine.injectIntoVisualPrompt(
      structure.mainSubject,
      injectionContext
    );

    structure.mainSubject = injection.injectedPrompt;
    structure.negativeInstructions = injection.negativePrompt;
    structure.injectedLocks = injection.injections;

    // Add product consistency if available
    if (injectionContext.productLock) {
      structure.productConsistency = this.buildProductConsistencyString(injectionContext.productLock);
    }

    return structure;
  }

  /**
   * Convert VeoPromptStructure to a single prompt string.
   */
  structureToPromptString(structure: VeoPromptStructure): string {
    const parts: string[] = [];

    if (structure.mainSubject) parts.push(structure.mainSubject);
    if (structure.environment) parts.push(`in ${structure.environment}`);
    if (structure.action) parts.push(structure.action);
    if (structure.cameraMovement) parts.push(`camera: ${structure.cameraMovement}`);
    if (structure.lighting) parts.push(`${structure.lighting} lighting`);
    if (structure.mood) parts.push(`${structure.mood} mood`);
    if (structure.realismLevel) parts.push(structure.realismLevel);
    if (structure.productConsistency) parts.push(structure.productConsistency);

    return parts.join('. ');
  }

  /**
   * Create a video generation queue job.
   */
  createQueueJob(input: VideoGenerationInput, priority: number = 0): VideoQueueJob {
    return {
      id: crypto.randomUUID(),
      kolId: input.kolId,
      campaignId: input.campaignId,
      sceneId: input.sceneId,
      mode: input.mode,
      input,
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
      priority,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Handle job completion — emit event for orchestrator.
   */
  async onJobCompleted(job: VideoQueueJob, userId: string): Promise<void> {
    await kolEventBus.emit({
      type: 'campaign.video.completed',
      payload: { job },
      metadata: {
        userId,
        kolId: job.kolId,
        campaignId: job.campaignId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Handle job failure — emit event for retry/repair.
   */
  async onJobFailed(job: VideoQueueJob, error: string, userId: string): Promise<void> {
    await kolEventBus.emit({
      type: 'campaign.video.failed',
      payload: { job, error },
      metadata: {
        userId,
        kolId: job.kolId,
        campaignId: job.campaignId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private buildProductConsistencyString(productLock: JsonData): string {
    const parts: string[] = [];
    if (productLock.product_name) parts.push(`showing ${productLock.product_name}`);
    if (productLock.preserve_logo) parts.push('with exact logo visible');
    if (productLock.preserve_packaging) parts.push('exact packaging preserved');
    return parts.join(', ');
  }
}
