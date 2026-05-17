import type { SupabaseClient } from '@supabase/supabase-js';
import { ScenePlanner } from './scene-planner';
import { PromptInjectionEngine } from './prompt-injection';
import { PromptMemoryService } from '../../services/prompt-memory.service';
import { KolDnaService } from '../../services/kol-dna.service';
import type {
  ScriptGenerationInput,
  GeneratedScript,
  GeneratedScene,
  ScriptEngineConfig,
} from './types';
import { DEFAULT_SCRIPT_ENGINE_CONFIG } from './types';
import type { PromptInjectionContext } from '../../types';

/**
 * Script Engine — Phase 4
 *
 * Orchestrates the full script generation pipeline:
 * 1. Load KOL DNA profile
 * 2. Build injection context
 * 3. Plan scenes
 * 4. Generate script via AI provider
 * 5. Inject consistency locks
 * 6. Return structured output
 *
 * NOTE: The actual AI generation call is abstracted via
 * a provider interface. This engine handles orchestration only.
 */
export class ScriptEngine {
  private scenePlanner: ScenePlanner;
  private injectionEngine: PromptInjectionEngine;
  private memoryService: PromptMemoryService;
  private dnaService: KolDnaService;
  private config: ScriptEngineConfig;

  constructor(db: SupabaseClient, config?: Partial<ScriptEngineConfig>) {
    this.config = { ...DEFAULT_SCRIPT_ENGINE_CONFIG, ...config };
    this.scenePlanner = new ScenePlanner(config);
    this.injectionEngine = new PromptInjectionEngine();
    this.memoryService = new PromptMemoryService(db);
    this.dnaService = new KolDnaService(db);
  }

  /**
   * Prepare the full generation context for script creation.
   * This is called before sending to AI provider.
   */
  async prepareGenerationContext(input: ScriptGenerationInput): Promise<ScriptGenerationContext> {
    // Load KOL DNA
    const dnaProfile = await this.dnaService.getFullDnaProfile(input.kolId);

    // Build injection context from prompt memories
    const injectionContext = await this.memoryService.buildInjectionContext(input.kolId);

    // Plan scene structure
    const sceneSkeleton = this.scenePlanner.createSceneSkeleton(input.videoDuration);

    return {
      input,
      dnaProfile,
      injectionContext,
      sceneSkeleton,
      config: this.config,
    };
  }

  /**
   * Process raw AI output into structured script with injections.
   * Called after AI provider returns raw generation.
   */
  processGeneratedScript(
    rawScenes: GeneratedScene[],
    injectionContext: PromptInjectionContext,
    input: ScriptGenerationInput
  ): ProcessedScriptResult {
    const processedScenes: GeneratedScene[] = rawScenes.map((scene) => {
      // Inject consistency locks into each scene's visual prompt
      const injection = this.injectionEngine.injectIntoVisualPrompt(
        scene.visualPrompt,
        injectionContext
      );

      return {
        ...scene,
        visualPrompt: injection.injectedPrompt,
        negativePrompt: injection.negativePrompt,
        sceneData: {
          ...scene.sceneData,
          injections: injection.injections,
          originalPrompt: injection.originalPrompt,
        },
      };
    });

    return {
      scenes: processedScenes,
      metadata: {
        totalDuration: input.videoDuration,
        sceneCount: processedScenes.length,
        platform: input.platform,
        contentType: input.contentType,
        generatedAt: new Date().toISOString(),
        injectionsApplied: processedScenes[0]?.sceneData?.injections || [],
      },
    };
  }

  /**
   * Build the system prompt for AI script generation.
   * Includes all KOL context and generation rules.
   */
  buildSystemPrompt(context: ScriptGenerationContext): string {
    const { input, dnaProfile, config } = context;

    const parts: string[] = [
      'You are a professional AI video script writer.',
      `Platform: ${input.platform}`,
      `Content type: ${input.contentType}`,
      `Total duration: ${input.videoDuration} seconds`,
      `Hook style: ${input.hookStyle}`,
      `CTA goal: ${input.ctaGoal}`,
      `Language: ${input.language || config.defaultLanguage}`,
      '',
      'RULES:',
      `- Each scene must be ${config.minSceneDuration}-${config.maxSceneDuration} seconds`,
      '- No subtitle prompts in visual descriptions',
      '- Avoid unsafe or inappropriate content',
      '- Optimize for short-form social media',
      '- Commercial quality, cinematic style',
      '- Consistency-first: maintain identity across scenes',
    ];

    // Add KOL identity context
    if (dnaProfile.identityDna) {
      parts.push('', 'KOL IDENTITY:');
      const dna = dnaProfile.identityDna;
      if (dna.gender) parts.push(`- Gender: ${dna.gender}`);
      if (dna.age_appearance) parts.push(`- Age appearance: ${dna.age_appearance}`);
      if (dna.ethnicity) parts.push(`- Ethnicity: ${dna.ethnicity}`);
      if (dna.hairstyle) parts.push(`- Hairstyle: ${dna.hairstyle}`);
      if (dna.body_type) parts.push(`- Body type: ${dna.body_type}`);
    }

    // Add visual anchor context
    if (dnaProfile.visualAnchor) {
      parts.push('', 'VISUAL ANCHOR (maintain in all scenes):');
      const anchor = dnaProfile.visualAnchor;
      if (anchor.face_shape) parts.push(`- Face: ${anchor.face_shape}`);
      if (anchor.eye_shape) parts.push(`- Eyes: ${anchor.eye_shape}`);
      if (anchor.hair_color) parts.push(`- Hair: ${anchor.hair_color} ${anchor.hair_length || ''}`);
    }

    return parts.join('\n');
  }

  /**
   * Build the user prompt for AI generation.
   */
  buildUserPrompt(input: ScriptGenerationInput): string {
    return [
      `Product/Service: ${input.product}`,
      `Idea: ${input.idea}`,
      '',
      'Generate a structured video script with:',
      '1. A compelling hook',
      '2. Problem identification',
      '3. Solution presentation',
      '4. Product/service showcase',
      '5. Clear CTA',
      '',
      'For each scene, provide:',
      '- scene number',
      '- duration (in seconds)',
      '- visual_prompt (cinematic English description for video generation)',
      '- voice_over_vi (Vietnamese voiceover text)',
      '- camera (camera angle/movement)',
      '- transition (to next scene)',
      '- negative_prompt (what to avoid)',
    ].join('\n');
  }
}

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════

export type ScriptGenerationContext = {
  input: ScriptGenerationInput;
  dnaProfile: Awaited<ReturnType<KolDnaService['getFullDnaProfile']>>;
  injectionContext: PromptInjectionContext;
  sceneSkeleton: ReturnType<ScenePlanner['createSceneSkeleton']>;
  config: ScriptEngineConfig;
};

export type ProcessedScriptResult = {
  scenes: GeneratedScene[];
  metadata: {
    totalDuration: number;
    sceneCount: number;
    platform: string;
    contentType: string;
    generatedAt: string;
    injectionsApplied: unknown[];
  };
};
