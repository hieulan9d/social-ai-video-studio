export type { AvatarProvider } from './avatar-provider';
export { NanoBananaProvider } from './nanobanana';

import "server-only";
import type { AvatarProvider } from './avatar-provider';
import { NanoBananaProvider } from './nanobanana';

/**
 * Factory: get the default avatar provider based on env config.
 */
export function getDefaultAvatarProvider(): AvatarProvider {
  const providerName = process.env.AVATAR_PROVIDER || 'nanobanana';

  switch (providerName) {
    case 'nanobanana':
      return new NanoBananaProvider();
    default:
      throw new Error(`Unknown avatar provider: ${providerName}`);
  }
}
