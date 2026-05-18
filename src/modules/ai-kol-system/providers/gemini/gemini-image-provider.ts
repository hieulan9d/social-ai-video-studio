import "server-only";

import type { AvatarProvider } from '../avatar-provider';
import type { AvatarProviderInput, AvatarProviderResult } from '../../types/avatar.types';

/**
 * Gemini Image Provider
 *
 * Uses Google Gemini API (generateContent) with image generation capability.
 * Model: gemini-2.0-flash-exp or imagen-3.0-generate-002
 *
 * API: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 */
export class GeminiImageProvider implements AvatarProvider {
  readonly name = 'gemini';

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    timeoutMs?: number;
  }) {
    this.apiKey =
      config?.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_VEO_API_KEY ||
      '';

    this.baseUrl = (
      config?.baseUrl ||
      process.env.GEMINI_BASE_URL ||
      process.env.GOOGLE_VEO_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta'
    ).replace(/\/$/, '');

    this.model =
      config?.model ||
      process.env.GEMINI_IMAGE_MODEL ||
      'gemini-3.1-flash-image-preview';

    this.timeoutMs = config?.timeoutMs ?? 120_000;

    if (!this.apiKey) {
      throw new Error('Gemini provider missing API key. Set GEMINI_API_KEY.');
    }
  }

  async generate(input: AvatarProviderInput): Promise<AvatarProviderResult> {
    const startedAt = Date.now();

    // Build parts array with text prompt and reference images
    const parts: GeminiPart[] = [];

    // Add reference images as inline data
    if (input.parentImageUrl) {
      const imageData = await this.urlToBase64(input.parentImageUrl);
      if (imageData) {
        parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } });
        parts.push({ text: `This is the current avatar to refine. Maintain exact identity.` });
      }
    }

    for (const ref of input.referenceImages) {
      const imageData = await this.urlToBase64(ref.url);
      if (imageData) {
        parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } });
        parts.push({ text: `Reference image (${ref.role}).` });
      }
    }

    // Add the main prompt
    parts.push({ text: input.prompt });
    parts.push({ text: '\nGenerate a high-quality photorealistic image based on the above instructions.' });

    // Call Gemini generateContent
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        temperature: 0.8,
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      });

      const rawText = await response.text();
      let rawResponse: Record<string, unknown> = {};

      try {
        rawResponse = JSON.parse(rawText);
      } catch {
        throw new Error(`Gemini returned non-JSON. Status ${response.status}. Body: ${rawText.slice(0, 200)}`);
      }

      if (!response.ok) {
        const errorMsg = (rawResponse.error as { message?: string })?.message || rawText.slice(0, 200);
        throw new Error(`Gemini API error (${response.status}): ${errorMsg}`);
      }

      // Extract images from response
      const outputUrls = this.extractImages(rawResponse);

      if (outputUrls.length === 0) {
        throw new Error('Gemini returned no images. The model may not support image generation with this prompt.');
      }

      return {
        outputUrls,
        rawResponse,
        generationTimeMs: Date.now() - startedAt,
        model: this.model,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gemini request timed out.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Extract base64 images from Gemini response and convert to data URLs.
   */
  private extractImages(response: Record<string, unknown>): string[] {
    const urls: string[] = [];

    const candidates = response.candidates as GeminiCandidate[] | undefined;
    if (!Array.isArray(candidates)) return urls;

    for (const candidate of candidates) {
      const content = candidate.content;
      if (!content?.parts) continue;

      for (const part of content.parts) {
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          // Convert to data URL
          urls.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }

    return urls;
  }

  /**
   * Convert a URL (or data URL) to base64 for Gemini inline_data.
   */
  private async urlToBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
    try {
      if (url.startsWith('data:')) {
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) return { mimeType: match[1], data: match[2] };
        return null;
      }

      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;

      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      return {
        mimeType: blob.type || 'image/png',
        data: buffer.toString('base64'),
      };
    } catch {
      return null;
    }
  }
}

// ── Gemini API types ──────────────────────────────────────

type GeminiPart =
  | { text: string; inlineData?: never }
  | { inlineData: { mimeType: string; data: string }; text?: never };

type GeminiCandidate = {
  content: {
    parts: Array<{
      text?: string;
      inlineData?: { mimeType: string; data: string };
    }>;
  };
};
