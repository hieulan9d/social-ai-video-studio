import type {
  BaseRecord,
  SoftDeletable,
  Versioned,
  JsonData,
  CampaignStatus,
  SceneStatus,
  VideoStatus,
  QaStatus,
  CampaignAssetType,
  PromptType,
} from './common.types';

// ============================================================
// CAMPAIGN
// ============================================================
export type CampaignRecord = BaseRecord & SoftDeletable & {
  kol_id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  description: string | null;
  campaign_goal: string | null;
  target_audience: string | null;
  platform: string | null;
  content_type: string | null;
  emotion_style: string | null;
  hook_style: string | null;
  cta_style: string | null;
  status: CampaignStatus;
  settings: JsonData;
  metadata: JsonData;
};

export type Campaign = {
  id: string;
  kolId: string;
  workspaceId: string;
  userId: string;
  name: string;
  description: string | null;
  campaignGoal: string | null;
  targetAudience: string | null;
  platform: string | null;
  contentType: string | null;
  emotionStyle: string | null;
  hookStyle: string | null;
  ctaStyle: string | null;
  status: CampaignStatus;
  settings: JsonData;
  metadata: JsonData;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCampaignInput = {
  kol_id: string;
  workspace_id: string;
  name: string;
  description?: string;
  campaign_goal?: string;
  target_audience?: string;
  platform?: string;
  content_type?: string;
  emotion_style?: string;
  hook_style?: string;
  cta_style?: string;
  settings?: JsonData;
  metadata?: JsonData;
};

export type UpdateCampaignInput = Partial<Omit<CreateCampaignInput, 'kol_id' | 'workspace_id'>> & {
  status?: CampaignStatus;
};

// ============================================================
// CAMPAIGN SCRIPT
// ============================================================
export type CampaignScriptRecord = BaseRecord & Versioned & {
  campaign_id: string;
  kol_id: string;
  title: string | null;
  content: string | null;
  structured_content: JsonData;
  generation_input: JsonData;
  generation_output: JsonData;
  provider: string | null;
  model: string | null;
};

export type CreateCampaignScriptInput = {
  campaign_id: string;
  kol_id: string;
  title?: string;
  content?: string;
  structured_content?: JsonData;
  generation_input?: JsonData;
  generation_output?: JsonData;
  provider?: string;
  model?: string;
};

// ============================================================
// CAMPAIGN ASSET
// ============================================================
export type CampaignAssetRecord = BaseRecord & SoftDeletable & {
  campaign_id: string;
  kol_id: string;
  asset_type: CampaignAssetType;
  name: string;
  file_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  metadata: JsonData;
  tags: unknown[];
};

export type CreateCampaignAssetInput = {
  campaign_id: string;
  kol_id: string;
  asset_type: CampaignAssetType;
  name: string;
  file_url?: string;
  storage_path?: string;
  mime_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  metadata?: JsonData;
  tags?: string[];
};

// ============================================================
// CAMPAIGN SCENE
// ============================================================
export type CampaignSceneRecord = BaseRecord & {
  campaign_id: string;
  script_id: string | null;
  scene_order: number;
  duration_seconds: number | null;
  visual_prompt: string | null;
  camera_angle: string | null;
  camera_movement: string | null;
  subject_action: string | null;
  background: string | null;
  lighting: string | null;
  voiceover: string | null;
  transition: string | null;
  negative_prompt: string | null;
  scene_data: JsonData;
  status: SceneStatus;
};

export type CreateCampaignSceneInput = {
  campaign_id: string;
  script_id?: string;
  scene_order: number;
  duration_seconds?: number;
  visual_prompt?: string;
  camera_angle?: string;
  camera_movement?: string;
  subject_action?: string;
  background?: string;
  lighting?: string;
  voiceover?: string;
  transition?: string;
  negative_prompt?: string;
  scene_data?: JsonData;
};

// ============================================================
// CAMPAIGN PROMPT
// ============================================================
export type CampaignPromptRecord = BaseRecord & Versioned & {
  campaign_id: string;
  scene_id: string | null;
  prompt_type: PromptType;
  content: string;
  structured_prompt: JsonData;
  injected_locks: JsonData;
};

export type CreateCampaignPromptInput = {
  campaign_id: string;
  scene_id?: string;
  prompt_type: PromptType;
  content: string;
  structured_prompt?: JsonData;
  injected_locks?: JsonData;
};

// ============================================================
// CAMPAIGN VIDEO
// ============================================================
export type CampaignVideoRecord = BaseRecord & {
  campaign_id: string;
  scene_id: string | null;
  prompt_id: string | null;
  status: VideoStatus;
  provider: string | null;
  provider_job_id: string | null;
  render_mode: string | null;
  file_url: string | null;
  storage_path: string | null;
  duration_seconds: number | null;
  resolution: string | null;
  fps: number | null;
  file_size: number | null;
  metadata: JsonData;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
};

// ============================================================
// CAMPAIGN QA REPORT
// ============================================================
export type CampaignQaReportRecord = BaseRecord & {
  campaign_id: string;
  video_id: string | null;
  scene_id: string | null;
  face_consistency_score: number | null;
  product_accuracy_score: number | null;
  hand_quality_score: number | null;
  background_consistency_score: number | null;
  voice_consistency_score: number | null;
  overall_score: number | null;
  issues: unknown[];
  recommendations: unknown[];
  auto_repair_actions: unknown[];
  status: QaStatus;
};
