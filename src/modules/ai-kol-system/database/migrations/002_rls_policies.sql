-- ============================================================
-- AI KOL SYSTEM — Migration 002: RLS Policies
-- ============================================================
-- Enables Row Level Security on all KOL tables
-- and creates policies that authorize via parent ownership.
-- ============================================================

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE kol_workspaces        ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_masters           ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_identity_dna      ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_visual_anchors    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_voice_dna         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_outfits           ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_outfit_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_reference_sheets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_prompt_memories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_motion_styles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaigns         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaign_scripts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaign_assets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaign_scenes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaign_prompts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaign_videos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE kol_campaign_qa_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP EXISTING POLICIES (idempotent re-run)
-- ============================================================
DROP POLICY IF EXISTS kol_workspaces_user_policy        ON kol_workspaces;
DROP POLICY IF EXISTS kol_masters_user_policy           ON kol_masters;
DROP POLICY IF EXISTS kol_campaigns_user_policy         ON kol_campaigns;
DROP POLICY IF EXISTS kol_identity_dna_policy           ON kol_identity_dna;
DROP POLICY IF EXISTS kol_visual_anchors_policy         ON kol_visual_anchors;
DROP POLICY IF EXISTS kol_voice_dna_policy              ON kol_voice_dna;
DROP POLICY IF EXISTS kol_outfits_policy                ON kol_outfits;
DROP POLICY IF EXISTS kol_outfit_tags_policy            ON kol_outfit_tags;
DROP POLICY IF EXISTS kol_reference_sheets_policy       ON kol_reference_sheets;
DROP POLICY IF EXISTS kol_prompt_memories_policy        ON kol_prompt_memories;
DROP POLICY IF EXISTS kol_motion_styles_policy          ON kol_motion_styles;
DROP POLICY IF EXISTS kol_campaign_scripts_policy       ON kol_campaign_scripts;
DROP POLICY IF EXISTS kol_campaign_assets_policy        ON kol_campaign_assets;
DROP POLICY IF EXISTS kol_campaign_scenes_policy        ON kol_campaign_scenes;
DROP POLICY IF EXISTS kol_campaign_prompts_policy       ON kol_campaign_prompts;
DROP POLICY IF EXISTS kol_campaign_videos_policy        ON kol_campaign_videos;
DROP POLICY IF EXISTS kol_campaign_qa_reports_policy    ON kol_campaign_qa_reports;

-- ============================================================
-- TOP-LEVEL TABLES (have user_id directly)
-- ============================================================
CREATE POLICY kol_workspaces_user_policy ON kol_workspaces
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY kol_masters_user_policy ON kol_masters
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY kol_campaigns_user_policy ON kol_campaigns
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- KOL CHILD TABLES (authorize via kol_masters.user_id)
-- ============================================================
CREATE POLICY kol_identity_dna_policy ON kol_identity_dna
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_identity_dna.kol_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_identity_dna.kol_id AND m.user_id = auth.uid()
  ));

CREATE POLICY kol_visual_anchors_policy ON kol_visual_anchors
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_visual_anchors.kol_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_visual_anchors.kol_id AND m.user_id = auth.uid()
  ));

CREATE POLICY kol_voice_dna_policy ON kol_voice_dna
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_voice_dna.kol_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_voice_dna.kol_id AND m.user_id = auth.uid()
  ));

CREATE POLICY kol_outfits_policy ON kol_outfits
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_outfits.kol_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_outfits.kol_id AND m.user_id = auth.uid()
  ));

CREATE POLICY kol_outfit_tags_policy ON kol_outfit_tags
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_outfits o JOIN kol_masters m ON m.id = o.kol_id
    WHERE o.id = kol_outfit_tags.outfit_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_outfits o JOIN kol_masters m ON m.id = o.kol_id
    WHERE o.id = kol_outfit_tags.outfit_id AND m.user_id = auth.uid()
  ));

CREATE POLICY kol_reference_sheets_policy ON kol_reference_sheets
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_reference_sheets.kol_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_reference_sheets.kol_id AND m.user_id = auth.uid()
  ));

CREATE POLICY kol_prompt_memories_policy ON kol_prompt_memories
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_prompt_memories.kol_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_prompt_memories.kol_id AND m.user_id = auth.uid()
  ));

CREATE POLICY kol_motion_styles_policy ON kol_motion_styles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_motion_styles.kol_id AND m.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_masters m
    WHERE m.id = kol_motion_styles.kol_id AND m.user_id = auth.uid()
  ));

-- ============================================================
-- CAMPAIGN CHILD TABLES (authorize via kol_campaigns.user_id)
-- ============================================================
CREATE POLICY kol_campaign_scripts_policy ON kol_campaign_scripts
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_scripts.campaign_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_scripts.campaign_id AND c.user_id = auth.uid()
  ));

CREATE POLICY kol_campaign_assets_policy ON kol_campaign_assets
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_assets.campaign_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_assets.campaign_id AND c.user_id = auth.uid()
  ));

CREATE POLICY kol_campaign_scenes_policy ON kol_campaign_scenes
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_scenes.campaign_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_scenes.campaign_id AND c.user_id = auth.uid()
  ));

CREATE POLICY kol_campaign_prompts_policy ON kol_campaign_prompts
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_prompts.campaign_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_prompts.campaign_id AND c.user_id = auth.uid()
  ));

CREATE POLICY kol_campaign_videos_policy ON kol_campaign_videos
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_videos.campaign_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_videos.campaign_id AND c.user_id = auth.uid()
  ));

CREATE POLICY kol_campaign_qa_reports_policy ON kol_campaign_qa_reports
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_qa_reports.campaign_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM kol_campaigns c
    WHERE c.id = kol_campaign_qa_reports.campaign_id AND c.user_id = auth.uid()
  ));
