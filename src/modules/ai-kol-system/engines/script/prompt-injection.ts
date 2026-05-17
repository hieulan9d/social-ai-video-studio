import type { JsonData, PromptInjectionContext } from '../../types';

/**
 * Prompt Injection Engine — Phase 4
 *
 * Responsible for injecting consistency locks into prompts:
 * - KOL_VISUAL_ANCHOR
 * - PRODUCT_LOCK
 * - VOICE_LOCK
 * - NEGATIVE_PROMPT_MASTER
 * - CONSISTENCY_LOCK
 */

export type InjectionResult = {
  originalPrompt: string;
  injectedPrompt: string;
  injections: string[];
  negativePrompt: string;
};

export class PromptInjectionEngine {
  /**
   * Inject all applicable locks into a visual prompt.
   */
  injectIntoVisualPrompt(
    basePrompt: string,
    context: PromptInjectionContext
  ): InjectionResult {
    const injections: string[] = [];
    let injectedPrompt = basePrompt;

    // Inject visual anchor
    if (context.visualAnchor) {
      const anchorStr = this.buildAnchorString(context.visualAnchor);
      injectedPrompt = `${injectedPrompt}. ${anchorStr}`;
      injections.push('VISUAL_ANCHOR');
    }

    // Inject product lock
    if (context.productLock) {
      const productStr = this.buildProductLockString(context.productLock);
      injectedPrompt = `${injectedPrompt}. ${productStr}`;
      injections.push('PRODUCT_LOCK');
    }

    // Inject consistency lock
    if (context.consistencyLock) {
      const consistencyStr = this.buildConsistencyString(context.consistencyLock);
      injectedPrompt = `${injectedPrompt}. ${consistencyStr}`;
      injections.push('CONSISTENCY_LOCK');
    }

    // Inject style presets
    for (const preset of context.stylePresets) {
      const styleStr = this.flattenToString(preset);
      if (styleStr) {
        injectedPrompt = `${injectedPrompt}. ${styleStr}`;
        injections.push('STYLE_PRESET');
      }
    }

    // Inject camera presets
    for (const preset of context.cameraPresets) {
      const cameraStr = this.flattenToString(preset);
      if (cameraStr) {
        injectedPrompt = `${injectedPrompt}. ${cameraStr}`;
        injections.push('CAMERA_PRESET');
      }
    }

    // Build negative prompt
    const negativePrompt = this.buildNegativePrompt(context.negativePompt);

    return {
      originalPrompt: basePrompt,
      injectedPrompt,
      injections,
      negativePrompt,
    };
  }

  private buildAnchorString(anchor: JsonData): string {
    const parts: string[] = [];
    if (anchor.face_shape) parts.push(`${anchor.face_shape} face`);
    if (anchor.eye_shape) parts.push(`${anchor.eye_shape} eyes`);
    if (anchor.hair_color && anchor.hair_length) {
      parts.push(`${anchor.hair_length} ${anchor.hair_color} hair`);
    }
    if (anchor.skin_texture) parts.push(`${anchor.skin_texture} skin`);
    return parts.length > 0
      ? `Subject has: ${parts.join(', ')}`
      : '';
  }

  private buildProductLockString(product: JsonData): string {
    const parts: string[] = [];
    if (product.product_name) parts.push(`Product: ${product.product_name}`);
    if (product.preserve_logo) parts.push('preserve exact logo');
    if (product.preserve_packaging) parts.push('preserve exact packaging');
    if (product.colors) parts.push(`colors: ${(product.colors as string[]).join(', ')}`);
    return parts.join('. ');
  }

  private buildConsistencyString(lock: JsonData): string {
    const parts: string[] = [];
    if (lock.maintain_identity) parts.push('maintain consistent identity');
    if (lock.maintain_outfit) parts.push('maintain consistent outfit');
    if (lock.maintain_environment) parts.push('maintain consistent environment');
    if (lock.maintain_lighting) parts.push('maintain consistent lighting');
    return parts.join(', ');
  }

  private buildNegativePrompt(negativeData: JsonData | null): string {
    if (!negativeData) {
      return 'blurry, low quality, distorted face, extra fingers, deformed hands, watermark, text overlay';
    }

    const items = negativeData.items as string[] | undefined;
    if (items && items.length > 0) {
      return items.join(', ');
    }

    return 'blurry, low quality, distorted face, extra fingers, deformed hands, watermark, text overlay';
  }

  private flattenToString(data: JsonData): string {
    const values = Object.values(data).filter(
      (v) => typeof v === 'string' && v.length > 0
    );
    return values.join(', ');
  }
}
