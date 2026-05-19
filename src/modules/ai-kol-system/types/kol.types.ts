import type {
  BaseRecord,
  SoftDeletable,
  Versioned,
  JsonData,
  KolStatus,
  PacingType,
  ReferenceSheetType,
  PromptMemoryType,
} from './common.types';

// ============================================================
// KOL MASTER
// ============================================================
export type KolMasterRecord = BaseRecord & SoftDeletable & {
  workspace_id: string;
  user_id: string;
  name: string;
  slug: string | null;
  status: KolStatus;
  avatar_url: string | null;
  settings: JsonData;
  metadata: JsonData;
};

export type KolMaster = {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  slug: string | null;
  status: KolStatus;
  avatarUrl: string | null;
  settings: JsonData;
  metadata: JsonData;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateKolInput = {
  workspace_id: string;
  name: string;
  slug?: string;
  avatar_url?: string;
  settings?: JsonData;
  metadata?: JsonData;
};

export type UpdateKolInput = Partial<Omit<CreateKolInput, 'workspace_id'>> & {
  status?: KolStatus;
};


// ============================================================
// IDENTITY DNA
// ============================================================
export type IdentityDnaRecord = BaseRecord & {
  kol_id: string;
  gender: string | null;
  age_appearance: string | null;
  ethnicity: string | null;
  skin_tone: string | null;
  face_structure: JsonData;
  hairstyle: string | null;
  body_type: string | null;
  personality: unknown[];
  fashion_style: unknown[];
  camera_style: JsonData;
  lighting_style: JsonData;
  custom_attributes: JsonData;
};

export type CreateIdentityDnaInput = {
  kol_id: string;
  gender?: string;
  age_appearance?: string;
  ethnicity?: string;
  skin_tone?: string;
  face_structure?: JsonData;
  hairstyle?: string;
  body_type?: string;
  personality?: unknown[];
  fashion_style?: unknown[];
  camera_style?: JsonData;
  lighting_style?: JsonData;
  custom_attributes?: JsonData;
};

// ============================================================
// VISUAL ANCHOR
// ============================================================
export type VisualAnchorRecord = BaseRecord & Versioned & {
  kol_id: string;
  face_shape: string | null;
  eye_shape: string | null;
  eye_color: string | null;
  nose_shape: string | null;
  lip_shape: string | null;
  jawline: string | null;
  skin_texture: string | null;
  hair_color: string | null;
  hair_length: string | null;
  hair_texture: string | null;
  distinguishing_features: unknown[];
  full_anchor_data: JsonData;
};

export type CreateVisualAnchorInput = {
  kol_id: string;
  face_shape?: string;
  eye_shape?: string;
  eye_color?: string;
  nose_shape?: string;
  lip_shape?: string;
  jawline?: string;
  skin_texture?: string;
  hair_color?: string;
  hair_length?: string;
  hair_texture?: string;
  distinguishing_features?: unknown[];
  full_anchor_data?: JsonData;
};

// ============================================================
// VOICE DNA
// ============================================================
export type VoiceDnaRecord = BaseRecord & {
  kol_id: string;
  voice_preset: string | null;
  accent: string | null;
  pacing: PacingType | null;
  emotion_style: string | null;
  tone_profiles: JsonData;
  pitch: string | null;
  warmth: string | null;
  energy: string | null;
  custom_attributes: JsonData;
};

export type CreateVoiceDnaInput = {
  kol_id: string;
  voice_preset?: string;
  accent?: string;
  pacing?: PacingType;
  emotion_style?: string;
  tone_profiles?: JsonData;
  pitch?: string;
  warmth?: string;
  energy?: string;
  custom_attributes?: JsonData;
};

// ============================================================
// OUTFIT
// ============================================================
export type OutfitRecord = BaseRecord & SoftDeletable & {
  kol_id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  storage_path: string | null;
  compatible_environments: unknown[];
  color_palette: unknown[];
  style_attributes: JsonData;
  is_default: boolean;
};

export type CreateOutfitInput = {
  kol_id: string;
  name: string;
  category?: string;
  description?: string;
  image_url?: string;
  storage_path?: string;
  compatible_environments?: unknown[];
  color_palette?: unknown[];
  style_attributes?: JsonData;
  is_default?: boolean;
  tags?: string[];
};

// ============================================================
// REFERENCE SHEET
// ============================================================
export type ReferenceSheetRecord = BaseRecord & SoftDeletable & Versioned & {
  kol_id: string;
  sheet_type: ReferenceSheetType;
  name: string;
  description: string | null;
  image_url: string | null;
  storage_path: string | null;
  sheet_data: JsonData;
  tags: unknown[];
};

export type CreateReferenceSheetInput = {
  kol_id: string;
  sheet_type: ReferenceSheetType;
  name: string;
  description?: string;
  image_url?: string;
  storage_path?: string;
  sheet_data?: JsonData;
  tags?: string[];
};

// ============================================================
// PROMPT MEMORY
// ============================================================
export type PromptMemoryRecord = BaseRecord & SoftDeletable & Versioned & {
  kol_id: string;
  memory_type: PromptMemoryType;
  name: string;
  description: string | null;
  prompt_data: JsonData;
  is_injectable: boolean;
  priority: number;
};

export type CreatePromptMemoryInput = {
  kol_id: string;
  memory_type: PromptMemoryType;
  name: string;
  description?: string;
  prompt_data?: JsonData;
  is_injectable?: boolean;
  priority?: number;
};

// ============================================================
// MOTION STYLE
// ============================================================
export type MotionStyleRecord = BaseRecord & SoftDeletable & {
  kol_id: string;
  name: string;
  description: string | null;
  motion_data: JsonData;
  camera_defaults: JsonData;
  transition_defaults: JsonData;
  is_default: boolean;
};

export type CreateMotionStyleInput = {
  kol_id: string;
  name: string;
  description?: string;
  motion_data?: JsonData;
  camera_defaults?: JsonData;
  transition_defaults?: JsonData;
  is_default?: boolean;
};
