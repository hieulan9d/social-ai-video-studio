import type { BaseRecord, JsonData, JsonArray } from './common.types';

/**
 * Avatar Generation System Types
 * Phase: KOL Avatar Generation
 */

export type AvatarSessionStatus = 'active' | 'finalized' | 'abandoned';
export type AvatarGenerationStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type AvatarReferenceRole = 'face' | 'hair' | 'makeup' | 'outfit' | 'style' | 'pose' | 'general';

// ── Avatar Session ──────────────────────────────────────────

export type AvatarSessionRecord = BaseRecord & {
  kol_id: string;
  user_id: string;
  status: AvatarSessionStatus;
  current_version: number;
  finalized_avatar_id: string | null;
  metadata: JsonData;
  finalized_at: string | null;
};

export type AvatarSession = {
  id: string;
  kolId: string;
  userId: string;
  status: AvatarSessionStatus;
  currentVersion: number;
  finalizedAvatarId: string | null;
  metadata: JsonData;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── Avatar Generation ───────────────────────────────────────

export type AvatarGenerationRecord = BaseRecord & {
  session_id: string;
  parent_generation_id: string | null;
  version: number;
  prompt: string;
  enhanced_prompt: string | null;
  status: AvatarGenerationStatus;
  provider: string;
  model: string | null;
  settings: JsonData;
  candidate_count: number;
  selected_candidate_index: number | null;
  selected: boolean;
  output_urls: string[];
  output_storage_paths: string[];
  raw_response: JsonData;
  error_message: string | null;
  generation_time_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
};

export type AvatarGeneration = {
  id: string;
  sessionId: string;
  parentGenerationId: string | null;
  version: number;
  prompt: string;
  enhancedPrompt: string | null;
  status: AvatarGenerationStatus;
  provider: string;
  model: string | null;
  settings: JsonData;
  candidateCount: number;
  selectedCandidateIndex: number | null;
  selected: boolean;
  outputUrls: string[];
  outputStoragePaths: string[];
  errorMessage: string | null;
  generationTimeMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── Reference Image ─────────────────────────────────────────

export type AvatarReferenceImageRecord = {
  id: string;
  session_id: string;
  generation_id: string | null;
  role: AvatarReferenceRole;
  storage_provider: string;
  storage_bucket: string;
  storage_path: string;
  file_url: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  display_order: number;
  metadata: JsonData;
  created_at: string;
};

export type AvatarReferenceImage = {
  id: string;
  sessionId: string;
  generationId: string | null;
  role: AvatarReferenceRole;
  storageBucket: string;
  storagePath: string;
  fileUrl: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  displayOrder: number;
  metadata: JsonData;
  createdAt: string;
};

// ── Identity Lock ───────────────────────────────────────────

export type IdentityLockRecord = BaseRecord & {
  kol_id: string;
  user_id: string;
  session_id: string | null;
  source_generation_id: string | null;
  official_avatar_url: string;
  official_avatar_storage_path: string;
  official_avatar_bucket: string;
  visual_anchor: JsonData;
  consistency_rules: JsonData;
  face_lock: JsonData;
  reference_images: JsonData | JsonArray;
  prompt_history: JsonData | JsonArray;
  generation_history: JsonData | JsonArray;
  is_locked: boolean;
  version: number;
  metadata: JsonData;
  locked_at: string;
  unlocked_at: string | null;
};

export type IdentityLock = {
  id: string;
  kolId: string;
  userId: string;
  sessionId: string | null;
  sourceGenerationId: string | null;
  officialAvatarUrl: string;
  officialAvatarStoragePath: string;
  officialAvatarBucket: string;
  visualAnchor: JsonData;
  consistencyRules: JsonData;
  faceLock: JsonData;
  referenceImages: JsonData | JsonArray;
  promptHistory: JsonData | JsonArray;
  generationHistory: JsonData | JsonArray;
  isLocked: boolean;
  version: number;
  metadata: JsonData;
  lockedAt: string;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── Inputs ──────────────────────────────────────────────────

export type CreateAvatarSessionInput = {
  kol_id: string;
};

export type CreateAvatarGenerationInput = {
  session_id: string;
  parent_generation_id?: string | null;
  prompt: string;
  candidate_count?: number;
  settings?: JsonData;
};

export type FinalizeAvatarInput = {
  session_id: string;
  generation_id: string;
  candidate_index: number;
  visual_anchor?: JsonData;
  consistency_rules?: JsonData;
};

// ── Provider abstraction ────────────────────────────────────

export type AvatarProviderInput = {
  prompt: string;
  candidateCount: number;
  referenceImages: AvatarProviderReferenceImage[];
  parentImageUrl?: string;
  settings?: JsonData;
};

export type AvatarProviderReferenceImage = {
  url: string;
  role: AvatarReferenceRole;
};

export type AvatarProviderResult = {
  outputUrls: string[];
  rawResponse: JsonData;
  generationTimeMs: number;
  model: string;
};
