-- ============================================================
-- AI KOL SYSTEM — Phase 1: Core Foundation
-- Database Migration 001
-- ============================================================
-- Architecture: UUID, timestamps, soft delete, versioning
-- All tables use snake_case naming convention
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. WORKSPACES
-- Top-level container for organizing KOLs
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_workspaces_user_id ON kol_workspaces(user_id);
CREATE INDEX idx_kol_workspaces_deleted_at ON kol_workspaces(deleted_at);

-- ============================================================
-- 2. KOL MASTERS
-- Core KOL identity entity
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_masters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES kol_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  avatar_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_masters_workspace_id ON kol_masters(workspace_id);
CREATE INDEX idx_kol_masters_user_id ON kol_masters(user_id);
CREATE INDEX idx_kol_masters_status ON kol_masters(status);
CREATE INDEX idx_kol_masters_deleted_at ON kol_masters(deleted_at);
CREATE UNIQUE INDEX idx_kol_masters_slug ON kol_masters(workspace_id, slug) WHERE deleted_at IS NULL;

-- ============================================================
-- 3. KOL IDENTITY DNA
-- Structured identity data (1:1 with kol_masters)
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_identity_dna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL UNIQUE REFERENCES kol_masters(id) ON DELETE CASCADE,
  gender TEXT,
  age_appearance TEXT,
  ethnicity TEXT,
  skin_tone TEXT,
  face_structure JSONB NOT NULL DEFAULT '{}',
  hairstyle TEXT,
  body_type TEXT,
  personality JSONB NOT NULL DEFAULT '[]',
  fashion_style JSONB NOT NULL DEFAULT '[]',
  camera_style JSONB NOT NULL DEFAULT '{}',
  lighting_style JSONB NOT NULL DEFAULT '{}',
  custom_attributes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_identity_dna_kol_id ON kol_identity_dna(kol_id);

-- ============================================================
-- 4. KOL VISUAL ANCHORS
-- Structured visual consistency data (versioned)
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_visual_anchors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  face_shape TEXT,
  eye_shape TEXT,
  eye_color TEXT,
  nose_shape TEXT,
  lip_shape TEXT,
  jawline TEXT,
  skin_texture TEXT,
  hair_color TEXT,
  hair_length TEXT,
  hair_texture TEXT,
  distinguishing_features JSONB NOT NULL DEFAULT '[]',
  full_anchor_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_visual_anchors_kol_id ON kol_visual_anchors(kol_id);
CREATE INDEX idx_kol_visual_anchors_active ON kol_visual_anchors(kol_id, is_active);

-- ============================================================
-- 5. KOL VOICE DNA
-- Voice identity and preset data (1:1 with kol_masters)
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_voice_dna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL UNIQUE REFERENCES kol_masters(id) ON DELETE CASCADE,
  voice_preset TEXT,
  accent TEXT,
  pacing TEXT CHECK (pacing IN ('slow', 'moderate', 'fast', 'dynamic')),
  emotion_style TEXT,
  tone_profiles JSONB NOT NULL DEFAULT '{}',
  pitch TEXT,
  warmth TEXT,
  energy TEXT,
  custom_attributes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_voice_dna_kol_id ON kol_voice_dna(kol_id);

-- ============================================================
-- 6. KOL OUTFITS
-- Outfit library with tagging system
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_outfits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'casual',
  description TEXT,
  image_url TEXT,
  storage_path TEXT,
  compatible_environments JSONB NOT NULL DEFAULT '[]',
  color_palette JSONB NOT NULL DEFAULT '[]',
  style_attributes JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_outfits_kol_id ON kol_outfits(kol_id);
CREATE INDEX idx_kol_outfits_category ON kol_outfits(category);
CREATE INDEX idx_kol_outfits_deleted_at ON kol_outfits(deleted_at);

-- ============================================================
-- 7. KOL OUTFIT TAGS
-- Flexible tagging for outfits
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_outfit_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id UUID NOT NULL REFERENCES kol_outfits(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_outfit_tags_outfit_id ON kol_outfit_tags(outfit_id);
CREATE INDEX idx_kol_outfit_tags_tag ON kol_outfit_tags(tag);

-- ============================================================
-- 8. KOL REFERENCE SHEETS
-- Character, expression, product, outfit sheets
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_reference_sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  sheet_type TEXT NOT NULL CHECK (sheet_type IN (
    'character', 'expression', 'product', 'outfit', 'environment', 'custom'
  )),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  storage_path TEXT,
  sheet_data JSONB NOT NULL DEFAULT '{}',
  tags JSONB NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_reference_sheets_kol_id ON kol_reference_sheets(kol_id);
CREATE INDEX idx_kol_reference_sheets_type ON kol_reference_sheets(sheet_type);
CREATE INDEX idx_kol_reference_sheets_deleted_at ON kol_reference_sheets(deleted_at);

-- ============================================================
-- 9. KOL PROMPT MEMORIES
-- Reusable structured prompt components
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_prompt_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'visual_anchor', 'product_lock', 'voice_lock', 'negative_prompt',
    'consistency_lock', 'style_preset', 'camera_preset', 'custom'
  )),
  name TEXT NOT NULL,
  description TEXT,
  prompt_data JSONB NOT NULL DEFAULT '{}',
  is_injectable BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_prompt_memories_kol_id ON kol_prompt_memories(kol_id);
CREATE INDEX idx_kol_prompt_memories_type ON kol_prompt_memories(memory_type);
CREATE INDEX idx_kol_prompt_memories_injectable ON kol_prompt_memories(kol_id, is_injectable, is_active);
CREATE INDEX idx_kol_prompt_memories_deleted_at ON kol_prompt_memories(deleted_at);

-- ============================================================
-- 10. KOL MOTION STYLES
-- Motion and animation presets
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_motion_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  motion_data JSONB NOT NULL DEFAULT '{}',
  camera_defaults JSONB NOT NULL DEFAULT '{}',
  transition_defaults JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_motion_styles_kol_id ON kol_motion_styles(kol_id);
CREATE INDEX idx_kol_motion_styles_deleted_at ON kol_motion_styles(deleted_at);

-- ============================================================
-- 11. KOL CAMPAIGNS
-- Campaign/Project system linked to KOL master
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES kol_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_goal TEXT,
  target_audience TEXT,
  platform TEXT,
  content_type TEXT,
  emotion_style TEXT,
  hook_style TEXT,
  cta_style TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'planning', 'in_production', 'review', 'completed', 'archived'
  )),
  settings JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_campaigns_kol_id ON kol_campaigns(kol_id);
CREATE INDEX idx_kol_campaigns_workspace_id ON kol_campaigns(workspace_id);
CREATE INDEX idx_kol_campaigns_user_id ON kol_campaigns(user_id);
CREATE INDEX idx_kol_campaigns_status ON kol_campaigns(status);
CREATE INDEX idx_kol_campaigns_deleted_at ON kol_campaigns(deleted_at);

-- ============================================================
-- 12. CAMPAIGN SCRIPTS (versioned)
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_campaign_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES kol_campaigns(id) ON DELETE CASCADE,
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT,
  structured_content JSONB NOT NULL DEFAULT '{}',
  generation_input JSONB NOT NULL DEFAULT '{}',
  generation_output JSONB NOT NULL DEFAULT '{}',
  provider TEXT,
  model TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_campaign_scripts_campaign_id ON kol_campaign_scripts(campaign_id);
CREATE INDEX idx_kol_campaign_scripts_version ON kol_campaign_scripts(campaign_id, version);

-- ============================================================
-- 13. CAMPAIGN ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_campaign_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES kol_campaigns(id) ON DELETE CASCADE,
  kol_id UUID NOT NULL REFERENCES kol_masters(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'product_image', 'logo', 'background', 'reference_image',
    'voiceover', 'music', 'subtitle', 'custom'
  )),
  name TEXT NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  mime_type TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  tags JSONB NOT NULL DEFAULT '[]',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_campaign_assets_campaign_id ON kol_campaign_assets(campaign_id);
CREATE INDEX idx_kol_campaign_assets_type ON kol_campaign_assets(asset_type);
CREATE INDEX idx_kol_campaign_assets_deleted_at ON kol_campaign_assets(deleted_at);

-- ============================================================
-- 14. CAMPAIGN SCENES
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_campaign_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES kol_campaigns(id) ON DELETE CASCADE,
  script_id UUID REFERENCES kol_campaign_scripts(id) ON DELETE SET NULL,
  scene_order INTEGER NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(5,2),
  visual_prompt TEXT,
  camera_angle TEXT,
  camera_movement TEXT,
  subject_action TEXT,
  background TEXT,
  lighting TEXT,
  voiceover TEXT,
  transition TEXT,
  negative_prompt TEXT,
  scene_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'prompt_ready', 'rendering', 'completed', 'failed'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_campaign_scenes_campaign_id ON kol_campaign_scenes(campaign_id);
CREATE INDEX idx_kol_campaign_scenes_order ON kol_campaign_scenes(campaign_id, scene_order);

-- ============================================================
-- 15. CAMPAIGN PROMPTS (versioned)
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_campaign_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES kol_campaigns(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES kol_campaign_scenes(id) ON DELETE SET NULL,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN (
    'veo', 'image', 'voice', 'music', 'custom'
  )),
  content TEXT NOT NULL,
  structured_prompt JSONB NOT NULL DEFAULT '{}',
  injected_locks JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_campaign_prompts_campaign ON kol_campaign_prompts(campaign_id);
CREATE INDEX idx_kol_campaign_prompts_scene ON kol_campaign_prompts(scene_id);
CREATE INDEX idx_kol_campaign_prompts_version ON kol_campaign_prompts(campaign_id, version);

-- ============================================================
-- 16. CAMPAIGN VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_campaign_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES kol_campaigns(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES kol_campaign_scenes(id) ON DELETE SET NULL,
  prompt_id UUID REFERENCES kol_campaign_prompts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'processing', 'completed', 'failed'
  )),
  provider TEXT,
  provider_job_id TEXT,
  render_mode TEXT,
  file_url TEXT,
  storage_path TEXT,
  duration_seconds NUMERIC(6,2),
  resolution TEXT,
  fps INTEGER,
  file_size INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_campaign_videos_campaign ON kol_campaign_videos(campaign_id);
CREATE INDEX idx_kol_campaign_videos_scene ON kol_campaign_videos(scene_id);
CREATE INDEX idx_kol_campaign_videos_status ON kol_campaign_videos(status);

-- ============================================================
-- 17. CAMPAIGN QA REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS kol_campaign_qa_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES kol_campaigns(id) ON DELETE CASCADE,
  video_id UUID REFERENCES kol_campaign_videos(id) ON DELETE SET NULL,
  scene_id UUID REFERENCES kol_campaign_scenes(id) ON DELETE SET NULL,
  face_consistency_score NUMERIC(5,2),
  product_accuracy_score NUMERIC(5,2),
  hand_quality_score NUMERIC(5,2),
  background_consistency_score NUMERIC(5,2),
  voice_consistency_score NUMERIC(5,2),
  overall_score NUMERIC(5,2),
  issues JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  auto_repair_actions JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'passed', 'failed', 'repaired'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kol_campaign_qa_campaign ON kol_campaign_qa_reports(campaign_id);
CREATE INDEX idx_kol_campaign_qa_video ON kol_campaign_qa_reports(video_id);
CREATE INDEX idx_kol_campaign_qa_status ON kol_campaign_qa_reports(status);

-- ============================================================
-- 18. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION kol_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'kol_workspaces', 'kol_masters', 'kol_identity_dna',
      'kol_visual_anchors', 'kol_voice_dna', 'kol_outfits',
      'kol_reference_sheets', 'kol_prompt_memories', 'kol_motion_styles',
      'kol_campaigns', 'kol_campaign_scripts', 'kol_campaign_assets',
      'kol_campaign_scenes', 'kol_campaign_prompts',
      'kol_campaign_videos', 'kol_campaign_qa_reports'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION kol_update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 19. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE kol_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaigns ENABLE ROW LEVEL SECURITY;

-- Workspace: user can only see their own
CREATE POLICY kol_workspaces_user_policy ON kol_workspaces
  FOR ALL USING (auth.uid() = user_id);

-- KOL Masters: user can only see their own
CREATE POLICY kol_masters_user_policy ON kol_masters
  FOR ALL USING (auth.uid() = user_id);

-- Campaigns: user can only see their own
CREATE POLICY kol_campaigns_user_policy ON kol_campaigns
  FOR ALL USING (auth.uid() = user_id);
