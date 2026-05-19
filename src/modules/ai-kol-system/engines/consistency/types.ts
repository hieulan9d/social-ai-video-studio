import type { JsonData } from '../../types';

/**
 * Consistency Engine — Phase 7 Types
 * The middleware that ensures all prompts maintain identity.
 */

export type ConsistencyLockType =
  | 'identity'
  | 'product'
  | 'outfit'
  | 'background'
  | 'voice';

export type IdentityLock = {
  type: 'identity';
  face: JsonData;
  skinTone: string;
  hair: JsonData;
  age: string;
  enabled: boolean;
};

export type ProductLock = {
  type: 'product';
  logo: JsonData;
  packaging: JsonData;
  label: string;
  colors: string[];
  enabled: boolean;
};

export type OutfitLock = {
  type: 'outfit';
  clothing: JsonData;
  accessories: string[];
  colors: string[];
  enabled: boolean;
};

export type BackgroundLock = {
  type: 'background';
  environment: string;
  lighting: string;
  props: string[];
  enabled: boolean;
};

export type VoiceLock = {
  type: 'voice';
  voicePreset: string;
  accent: string;
  pacing: string;
  enabled: boolean;
};

export type ConsistencyLock =
  | IdentityLock
  | ProductLock
  | OutfitLock
  | BackgroundLock
  | VoiceLock;

export type ConsistencyProfile = {
  kolId: string;
  locks: ConsistencyLock[];
  globalNegativePrompt: string;
  strictMode: boolean;
};

export type ConsistencyValidationResult = {
  isConsistent: boolean;
  violations: ConsistencyViolation[];
  suggestions: string[];
};

export type ConsistencyViolation = {
  lockType: ConsistencyLockType;
  field: string;
  expected: string;
  actual: string;
  severity: 'warning' | 'error';
};

export type PromptTransformResult = {
  originalPrompt: string;
  transformedPrompt: string;
  appliedLocks: ConsistencyLockType[];
  negativePrompt: string;
  metadata: {
    transformedAt: string;
    lockCount: number;
    strictMode: boolean;
  };
};
