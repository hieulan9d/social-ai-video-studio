import type { SupabaseClient } from '@supabase/supabase-js';
import { KolDnaService } from '../../services/kol-dna.service';
import { PromptInjectionEngine } from '../script/prompt-injection';
import { PromptMemoryService } from '../../services/prompt-memory.service';
import type {
  ImageGenerationInput,
  ImageGenerationResult,
  ImageQueueJob,
  CharacterReferenceConfig,
  ProductReferenceConfig,
  OutfitTransferConfig,
  ProductInjectionConfig,
  SceneAssetConfig,
} from './types';
import type { JsonData } from '../../types';

/**
 * Image Generation Engine — Phase 5
 *
 * Manages image generation pipeline:
 * - Character reference sheets
 * - Product reference sheets
 * - Outfit transfers
 * - Product injection
 * - Scene assets
 *
 * Provider-agnostic: actual generation is delegated
 * to an ImageProvider interface.
 */
export class ImageEngine {
  private dnaService: KolDnaService;
  private memoryService: PromptMemoryService;
  private injectionEngine: PromptInjectionEngine;

  constructor(private db: SupabaseClient) {
    this.dnaService = new KolDnaService(db);
    this.memoryService = new PromptMemoryService(db);
    this.injectionEngine = new PromptInjectionEngine();
  }

  /**
   * Build prompt for character reference sheet generation.
   */
  async buildCharacterReferencePrompt(
    kolId: string,
    config: CharacterReferenceConfig
  ): Promise<string> {
    const dna = await this.dnaService.getFullDnaProfile(kolId);
    const parts: string[] = ['Character reference sheet'];

    if (dna.identityDna) {
      const id = dna.identityDna;
      parts.push(`${id.gender || 'person'}, ${id.age_appearance || 'adult'}`);
      if (id.ethnicity) parts.push(id.ethnicity);
      if (id.hairstyle) parts.push(id.hairstyle);
      if (id.body_type) parts.push(id.body_type);
    }

    if (dna.visualAnchor) {
      const va = dna.visualAnchor;
      if (va.face_shape) parts.push(`${va.face_shape} face`);
      if (va.eye_shape) parts.push(`${va.eye_shape} eyes`);
      if (va.hair_color) parts.push(`${va.hair_color} hair`);
    }

    // Add angle instructions
    const angleStr = config.angles.join(', ');
    parts.push(`Multiple angles: ${angleStr}`);

    if (config.includeFullBody) parts.push('full body view');
    if (config.includeCloseUp) parts.push('close-up face detail');
    if (config.includeExpressions && config.expressions) {
      parts.push(`Expressions: ${config.expressions.join(', ')}`);
    }

    parts.push('white background, clean reference sheet style, consistent character');

    return parts.join(', ');
  }

  /**
   * Build prompt for product reference sheet generation.
   */
  buildProductReferencePrompt(
    productData: JsonData,
    config: ProductReferenceConfig
  ): string {
    const parts: string[] = ['Product reference sheet'];

    if (productData.product_name) parts.push(String(productData.product_name));
    if (config.preserveLogo) parts.push('preserve exact logo design');
    if (config.preservePackaging) parts.push('preserve exact packaging');

    const angleStr = config.angles.join(', ');
    parts.push(`Multiple angles: ${angleStr}`);

    if (config.includeInHand) parts.push('one view showing product held in hand');
    parts.push('white background, product photography style, high detail');

    return parts.join(', ');
  }

  /**
   * Build prompt for outfit transfer.
   */
  async buildOutfitTransferPrompt(
    kolId: string,
    config: OutfitTransferConfig
  ): Promise<string> {
    const dna = await this.dnaService.getFullDnaProfile(kolId);
    const parts: string[] = ['Outfit transfer'];

    if (dna.visualAnchor) {
      parts.push('maintain exact face identity');
      parts.push('maintain exact body proportions');
    }

    if (config.replaceClothingOnly) {
      parts.push('replace clothing only, keep everything else identical');
    }

    parts.push('photorealistic, consistent identity, fashion photography');

    return parts.join(', ');
  }

  /**
   * Build prompt for product injection into scene.
   */
  buildProductInjectionPrompt(
    scenePrompt: string,
    config: ProductInjectionConfig
  ): string {
    const parts: string[] = [scenePrompt];

    if (config.realisticHandPlacement) parts.push('realistic hand placement holding product');
    if (config.realisticShadows) parts.push('realistic shadows on product');
    if (config.preserveExactLogo) parts.push('preserve exact logo on product');
    if (config.preservePackagingColors) parts.push('preserve exact packaging colors');

    return parts.join(', ');
  }

  /**
   * Build prompt for scene asset generation.
   */
  buildSceneAssetPrompt(config: SceneAssetConfig): string {
    const parts: string[] = [
      config.environment,
      `${config.lighting} lighting`,
      `${config.mood} mood`,
    ];

    if (config.timeOfDay) parts.push(config.timeOfDay);
    if (config.includeProps) parts.push(`Props: ${config.includeProps.join(', ')}`);

    parts.push('cinematic, high quality, photorealistic');

    return parts.join(', ');
  }

  /**
   * Create a generation job for the queue.
   */
  createQueueJob(input: ImageGenerationInput, priority: number = 0): ImageQueueJob {
    return {
      id: crypto.randomUUID(),
      kolId: input.kolId,
      campaignId: input.campaignId,
      mode: input.mode,
      input,
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
      priority,
      createdAt: new Date().toISOString(),
    };
  }
}
