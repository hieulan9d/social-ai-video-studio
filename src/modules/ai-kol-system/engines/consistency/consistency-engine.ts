import type { SupabaseClient } from '@supabase/supabase-js';
import { KolDnaService } from '../../services/kol-dna.service';
import { PromptMemoryService } from '../../services/prompt-memory.service';
import type {
  ConsistencyProfile,
  ConsistencyLock,
  PromptTransformResult,
  ConsistencyLockType,
  IdentityLock,
  ProductLock,
  OutfitLock,
  BackgroundLock,
  VoiceLock,
} from './types';
import type { JsonData } from '../../types';

/**
 * Consistency Engine — Phase 7
 *
 * This is the MIDDLEWARE that all prompts pass through
 * before generation. It ensures:
 * - Face consistency across scenes
 * - Product consistency
 * - Outfit consistency
 * - Background consistency
 * - Voice consistency
 *
 * Architecture: Pipeline pattern
 * Input Prompt → [Lock Injection] → [Validation] → Output Prompt
 */
export class ConsistencyEngine {
  private dnaService: KolDnaService;
  private memoryService: PromptMemoryService;

  constructor(private db: SupabaseClient) {
    this.dnaService = new KolDnaService(db);
    this.memoryService = new PromptMemoryService(db);
  }

  /**
   * Build the full consistency profile for a KOL.
   * This loads all locks from DNA + prompt memories.
   */
  async buildConsistencyProfile(kolId: string): Promise<ConsistencyProfile> {
    const dna = await this.dnaService.getFullDnaProfile(kolId);
    const locks: ConsistencyLock[] = [];

    // Build identity lock from visual anchor
    if (dna.visualAnchor) {
      locks.push({
        type: 'identity',
        face: {
          shape: dna.visualAnchor.face_shape,
          eyes: dna.visualAnchor.eye_shape,
          eyeColor: dna.visualAnchor.eye_color,
          nose: dna.visualAnchor.nose_shape,
          lips: dna.visualAnchor.lip_shape,
          jawline: dna.visualAnchor.jawline,
        },
        skinTone: dna.visualAnchor.skin_texture || '',
        hair: {
          color: dna.visualAnchor.hair_color,
          length: dna.visualAnchor.hair_length,
          texture: dna.visualAnchor.hair_texture,
        },
        age: dna.identityDna?.age_appearance || '',
        enabled: true,
      });
    }

    // Build voice lock from voice DNA
    if (dna.voiceDna) {
      locks.push({
        type: 'voice',
        voicePreset: dna.voiceDna.voice_preset || '',
        accent: dna.voiceDna.accent || '',
        pacing: dna.voiceDna.pacing || 'moderate',
        enabled: true,
      });
    }

    // Build negative prompt from memories
    const negativeMemories = await this.memoryService.getByType(kolId, 'negative_prompt');
    const negativeItems = negativeMemories.flatMap(
      (m) => (m.prompt_data.items as string[]) || []
    );
    const globalNegative = negativeItems.length > 0
      ? negativeItems.join(', ')
      : 'blurry, low quality, distorted face, extra fingers, deformed hands, watermark';

    return {
      kolId,
      locks,
      globalNegativePrompt: globalNegative,
      strictMode: true,
    };
  }

  /**
   * Transform a prompt through the consistency pipeline.
   * This is the main entry point — all prompts should pass through here.
   */
  async transformPrompt(
    kolId: string,
    prompt: string,
    activeLockTypes?: ConsistencyLockType[]
  ): Promise<PromptTransformResult> {
    const profile = await this.buildConsistencyProfile(kolId);
    let transformedPrompt = prompt;
    const appliedLocks: ConsistencyLockType[] = [];

    for (const lock of profile.locks) {
      // Skip disabled locks
      if (!lock.enabled) continue;

      // Skip if not in active lock types filter
      if (activeLockTypes && !activeLockTypes.includes(lock.type)) continue;

      const injection = this.applyLock(lock);
      if (injection) {
        transformedPrompt = `${transformedPrompt}. ${injection}`;
        appliedLocks.push(lock.type);
      }
    }

    return {
      originalPrompt: prompt,
      transformedPrompt,
      appliedLocks,
      negativePrompt: profile.globalNegativePrompt,
      metadata: {
        transformedAt: new Date().toISOString(),
        lockCount: appliedLocks.length,
        strictMode: profile.strictMode,
      },
    };
  }

  /**
   * Apply a specific lock and return the injection string.
   */
  private applyLock(lock: ConsistencyLock): string | null {
    switch (lock.type) {
      case 'identity':
        return this.applyIdentityLock(lock);
      case 'product':
        return this.applyProductLock(lock);
      case 'outfit':
        return this.applyOutfitLock(lock);
      case 'background':
        return this.applyBackgroundLock(lock);
      case 'voice':
        return this.applyVoiceLock(lock);
      default:
        return null;
    }
  }

  private applyIdentityLock(lock: IdentityLock): string {
    const parts: string[] = [];
    const face = lock.face as Record<string, string>;

    if (face.shape) parts.push(`${face.shape} face shape`);
    if (face.eyes) parts.push(`${face.eyes} eyes`);
    if (face.eyeColor) parts.push(`${face.eyeColor} eye color`);
    if (lock.skinTone) parts.push(`${lock.skinTone} skin`);

    const hair = lock.hair as Record<string, string>;
    if (hair.color && hair.length) parts.push(`${hair.length} ${hair.color} hair`);

    if (lock.age) parts.push(`appears ${lock.age}`);

    return parts.length > 0
      ? `[IDENTITY LOCK: ${parts.join(', ')}]`
      : '';
  }

  private applyProductLock(lock: ProductLock): string {
    const parts: string[] = [];

    if (lock.label) parts.push(`product: ${lock.label}`);
    if (lock.colors.length > 0) parts.push(`colors: ${lock.colors.join(', ')}`);

    const logo = lock.logo as Record<string, string>;
    if (logo.preserve) parts.push('preserve exact logo');

    const packaging = lock.packaging as Record<string, string>;
    if (packaging.preserve) parts.push('preserve exact packaging');

    return parts.length > 0
      ? `[PRODUCT LOCK: ${parts.join(', ')}]`
      : '';
  }

  private applyOutfitLock(lock: OutfitLock): string {
    const parts: string[] = [];
    const clothing = lock.clothing as Record<string, string>;

    if (clothing.description) parts.push(clothing.description);
    if (lock.accessories.length > 0) parts.push(`accessories: ${lock.accessories.join(', ')}`);
    if (lock.colors.length > 0) parts.push(`outfit colors: ${lock.colors.join(', ')}`);

    return parts.length > 0
      ? `[OUTFIT LOCK: ${parts.join(', ')}]`
      : '';
  }

  private applyBackgroundLock(lock: BackgroundLock): string {
    const parts: string[] = [];

    if (lock.environment) parts.push(lock.environment);
    if (lock.lighting) parts.push(`${lock.lighting} lighting`);
    if (lock.props.length > 0) parts.push(`props: ${lock.props.join(', ')}`);

    return parts.length > 0
      ? `[BACKGROUND LOCK: ${parts.join(', ')}]`
      : '';
  }

  private applyVoiceLock(lock: VoiceLock): string {
    const parts: string[] = [];

    if (lock.voicePreset) parts.push(`voice: ${lock.voicePreset}`);
    if (lock.accent) parts.push(`accent: ${lock.accent}`);
    if (lock.pacing) parts.push(`pacing: ${lock.pacing}`);

    return parts.length > 0
      ? `[VOICE LOCK: ${parts.join(', ')}]`
      : '';
  }

  /**
   * Add a runtime lock (e.g., from campaign settings).
   */
  createProductLock(productData: JsonData): ProductLock {
    return {
      type: 'product',
      logo: { preserve: productData.preserve_logo || false },
      packaging: { preserve: productData.preserve_packaging || false },
      label: String(productData.product_name || ''),
      colors: (productData.colors as string[]) || [],
      enabled: true,
    };
  }

  createOutfitLock(outfitData: JsonData): OutfitLock {
    return {
      type: 'outfit',
      clothing: { description: String(outfitData.description || '') },
      accessories: (outfitData.accessories as string[]) || [],
      colors: (outfitData.colors as string[]) || [],
      enabled: true,
    };
  }

  createBackgroundLock(sceneData: JsonData): BackgroundLock {
    return {
      type: 'background',
      environment: String(sceneData.environment || ''),
      lighting: String(sceneData.lighting || ''),
      props: (sceneData.props as string[]) || [],
      enabled: true,
    };
  }
}
