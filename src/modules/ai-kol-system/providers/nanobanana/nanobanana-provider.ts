import "server-only";

import type { AvatarProvider } from '../avatar-provider';
import type { AvatarProviderInput, AvatarProviderResult } from '../../types/avatar.types';

/**
 * NanoBanana Avatar Provider
 *
 * Calls the NanoBanana image generation API via the 9router gateway,
 * which exposes an OpenAI-compatible endpoint.
 *
 * Architecture:
 * - Provider-only: knows nothing about DB, storage, or sessions
 * - Returns raw URLs that the service layer persists
 */
export class NanoBananaProvider implements AvatarProvider {
  readonly name = 'nanobanana';

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config?: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    timeoutMs?: number;
  }) {
    this.baseUrl = (
      config?.baseUrl ||
      process.env.NANOBANANA_BASE_URL ||
      process.env.NINE_ROUTER_BASE_URL ||
      process.env.AI_BASE_URL ||
      "http://localhost:20128/v1"
    ).replace(/\/$/, '');

    this.apiKey =
      config?.apiKey ||
      process.env.NANOBANANA_API_KEY ||
      process.env.NINE_ROUTER_API_KEY ||
      process.env["9ROUTER_API_KEY"] ||
      process.env.GEMINI_API_KEY ||
      '';

    this.model =
      config?.model ||
      process.env.NANOBANANA_MODEL ||
      process.env.AI_IMAGE_MODEL ||
      'nanobanana';

    this.timeoutMs = config?.timeoutMs ?? 180_000;

    if (!this.apiKey) {
      throw new Error(
        'NanoBanana provider missing API key. Set NANOBANANA_API_KEY, NINE_ROUTER_API_KEY, or GEMINI_API_KEY.'
      );
    }
  }

  async generate(input: AvatarProviderInput): Promise<AvatarProviderResult> {
    const startedAt = Date.now();
    const enhancedPrompt = this.buildPromptWithRoles(input);

    // Build the request body following 9router image generation API
    const body: Record<string, unknown> = {
      model: this.model,
      prompt: enhancedPrompt,
      n: input.candidateCount,
      response_format: 'url',
    };

    // Reference images: prefer parent first, then role-tagged refs
    const referenceUrls = [
      input.parentImageUrl,
      ...input.referenceImages.map((r) => r.url),
    ].filter((u): u is string => Boolean(u));

    if (referenceUrls.length > 0) {
      // Primary reference (single)
      body.reference_image = referenceUrls[0];
      // Multi-reference (some providers support arrays)
      body.reference_images = referenceUrls;
    }

    // Pass through optional settings
    if (input.settings) {
      Object.assign(body, input.settings);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: controller.signal,
      });

      const rawText = await response.text();
      let rawResponse: Record<string, unknown> = {};

      if (rawText) {
        try {
          rawResponse = JSON.parse(rawText);
        } catch {
          throw new Error(
            `NanoBanana returned non-JSON response. Status ${response.status}. Body: ${rawText.slice(0, 200)}`
          );
        }
      }

      if (!response.ok) {
        const message =
          (rawResponse.error as { message?: string })?.message ||
          rawResponse.message ||
          response.statusText;
        throw new Error(`NanoBanana generation failed (${response.status}): ${String(message)}`);
      }

      const outputUrls = this.extractOutputUrls(rawResponse);

      if (outputUrls.length === 0) {
        throw new Error('NanoBanana returned no usable image URLs.');
      }

      return {
        outputUrls,
        rawResponse,
        generationTimeMs: Date.now() - startedAt,
        model: this.model,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('NanoBanana request timed out.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Build prompt with role-tagged references appended.
   * E.g., "Create a beautiful Vietnamese girl. [face reference: img1] [hair reference: img2]"
   */
  private buildPromptWithRoles(input: AvatarProviderInput): string {
    const parts: string[] = [input.prompt.trim()];

    if (input.parentImageUrl) {
      parts.push(`Build upon previous avatar: ${input.parentImageUrl}`);
    }

    if (input.referenceImages.length > 0) {
      parts.push('Reference images:');
      for (const ref of input.referenceImages) {
        parts.push(`- ${ref.role} reference: ${ref.url}`);
      }
    }

    parts.push(
      'High quality, photorealistic, consistent identity, sharp focus, professional photography'
    );

    return parts.join('\n');
  }

  private extractOutputUrls(response: Record<string, unknown>): string[] {
    const urls: string[] = [];

    // Standard OpenAI format: { data: [{ url: ... }, { b64_json: ... }] }
    const data = response.data;
    if (Array.isArray(data)) {
      for (const item of data) {
        if (!item || typeof item !== 'object') continue;
        const record = item as Record<string, unknown>;

        if (typeof record.url === 'string') {
          urls.push(record.url);
        } else if (typeof record.output_url === 'string') {
          urls.push(record.output_url);
        } else if (typeof record.b64_json === 'string') {
          urls.push(`data:image/png;base64,${record.b64_json}`);
        }
      }
    }

    // Top-level url variants
    for (const key of ['url', 'output_url', 'image_url']) {
      const value = response[key];
      if (typeof value === 'string') urls.push(value);
    }

    // Output array
    const output = response.output;
    if (Array.isArray(output)) {
      urls.push(...output.filter((v): v is string => typeof v === 'string'));
    }

    return Array.from(new Set(urls));
  }
}
