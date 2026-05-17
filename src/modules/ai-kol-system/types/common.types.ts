/**
 * Common types shared across the AI KOL system
 */

/** Base fields present on all database records */
export type BaseRecord = {
  id: string;
  created_at: string;
  updated_at: string;
};

/** Records that support soft delete */
export type SoftDeletable = {
  deleted_at: string | null;
};

/** Records that support versioning */
export type Versioned = {
  version: number;
  is_active: boolean;
};

/** Generic JSON data container — supports objects, arrays, and primitives */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonData = Record<string, unknown>;
export type JsonArray = Record<string, unknown>[];

/** Structured generation settings — never store as plain text */
export type StructuredSettings = Record<string, unknown>;

/** Entity status types */
export type KolStatus = 'draft' | 'active' | 'archived';

export type CampaignStatus =
  | 'draft'
  | 'planning'
  | 'in_production'
  | 'review'
  | 'completed'
  | 'archived';

export type SceneStatus =
  | 'draft'
  | 'prompt_ready'
  | 'rendering'
  | 'completed'
  | 'failed';

export type VideoStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type QaStatus = 'pending' | 'passed' | 'failed' | 'repaired';

export type PacingType = 'slow' | 'moderate' | 'fast' | 'dynamic';

export type ReferenceSheetType =
  | 'character'
  | 'expression'
  | 'product'
  | 'outfit'
  | 'environment'
  | 'custom';

export type PromptMemoryType =
  | 'visual_anchor'
  | 'product_lock'
  | 'voice_lock'
  | 'negative_prompt'
  | 'consistency_lock'
  | 'style_preset'
  | 'camera_preset'
  | 'custom';

export type CampaignAssetType =
  | 'product_image'
  | 'logo'
  | 'background'
  | 'reference_image'
  | 'voiceover'
  | 'music'
  | 'subtitle'
  | 'custom';

export type PromptType = 'veo' | 'image' | 'voice' | 'music' | 'custom';
