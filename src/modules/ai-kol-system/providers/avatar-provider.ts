import type {
  AvatarProviderInput,
  AvatarProviderResult,
} from '../types/avatar.types';

/**
 * Avatar Provider abstraction.
 * Allows swapping between NanoBanana, OpenAI, etc.
 */
export interface AvatarProvider {
  readonly name: string;
  generate(input: AvatarProviderInput): Promise<AvatarProviderResult>;
}
