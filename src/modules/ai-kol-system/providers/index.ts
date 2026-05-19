export type { AvatarProvider } from './avatar-provider';
export { NanoBananaProvider } from './nanobanana';
export { GeminiImageProvider } from './gemini';

import type { AvatarProvider } from './avatar-provider';
import { NanoBananaProvider } from './nanobanana';
import { GeminiImageProvider } from './gemini';

/**
 * Factory: get the default avatar provider based on env config.
 */
export function getDefaultAvatarProvider(): AvatarProvider {
  const providerName = process.env.AVATAR_PROVIDER;

  // Explicit choice via env
  if (providerName === 'nanobanana') {
    return new NanoBananaProvider();
  }

  // Default: always use Gemini if key is available
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_VEO_API_KEY;
  if (geminiKey) {
    return new GeminiImageProvider();
  }

  // Fallback to NanoBanana only if explicitly no Gemini key
  return new NanoBananaProvider();
}

/**
 * Check if the avatar provider is properly configured and reachable.
 */
export function isAvatarProviderConfigured(): boolean {
  const apiKey =
    process.env.NANOBANANA_API_KEY ||
    process.env.NINE_ROUTER_API_KEY ||
    process.env["9ROUTER_API_KEY"] ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_VEO_API_KEY;

  return Boolean(apiKey);
}
